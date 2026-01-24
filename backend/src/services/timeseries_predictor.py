import torch
import torch.nn as nn
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

class LSTMModel(nn.Module):
    def __init__(self, input_size=1, hidden_size=32, num_layers=1, output_size=1):
        super(LSTMModel, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        # Initialize hidden state and cell state
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size).to(x.device)
        
        # Forward propagate LSTM
        out, _ = self.lstm(x, (h0, c0))
        
        # Decode the hidden state of the last time step
        out = self.fc(out[:, -1, :])
        return out

async def predict_future_metrics(metrics_data: Dict[str, Any], n_future: int = 2) -> Dict[str, Any]:
    """
    Predict future values for each metric using an LSTM model.
    metrics_data structure: { metric_name: { timestamp_iso: { value: float, is_anamoly: bool } } }
    Returns: { metric_name: [ { date: str, value: float, is_prediction: True } ] }
    """
    predictions = {}
    
    # Define metric names we care about
    allowed_metrics = [
        "blood_pressure", "heart_rate", "temperature", "glucose", 
        "cholesterol", "hemoglobin", "wbc", "rbc", "platelets"
    ]

    for metric_name in allowed_metrics:
        values_dict = metrics_data.get(metric_name, {})
        if not values_dict or not isinstance(values_dict, dict) or len(values_dict) < 3:
            # Not enough data for LSTM (need at least 3 points for a tiny sequence)
            continue

        try:
            # 1. Sort and extract values
            sorted_timestamps = sorted(values_dict.keys())
            history_values = [float(values_dict[ts]["value"]) for ts in sorted_timestamps]
            last_dt = datetime.fromisoformat(sorted_timestamps[-1])
            
            # 2. Scale data (Min-Max)
            min_val = min(history_values)
            max_val = max(history_values)
            scale_range = max_val - min_val if max_val > min_val else 1.0
            
            scaled_history = [(v - min_val) / scale_range for v in history_values]
            
            # 3. Prepare sequences for training
            # For small datasets, we use sliding window of size 2 to predict next
            X_train = []
            Y_train = []
            window_size = 2
            
            for i in range(len(scaled_history) - window_size):
                X_train.append(scaled_history[i:i+window_size])
                Y_train.append(scaled_history[i+window_size])
            
            X_train_tensor = torch.FloatTensor(X_train).view(-1, window_size, 1)
            Y_train_tensor = torch.FloatTensor(Y_train).view(-1, 1)
            
            # 4. Train small LSTM model on this patient's data
            model = LSTMModel(input_size=1, hidden_size=16, num_layers=1, output_size=1)
            criterion = nn.MSELoss()
            optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
            
            # Quick training loop (very fast for small data)
            model.train()
            for epoch in range(100):
                optimizer.zero_grad()
                outputs = model(X_train_tensor)
                loss = criterion(outputs, Y_train_tensor)
                loss.backward()
                optimizer.step()
            
            # 5. Predict future values autoregressively
            model.eval()
            current_seq = scaled_history[-window_size:]
            predicted_scaled = []
            
            for _ in range(n_future):
                input_tensor = torch.FloatTensor(current_seq).view(1, window_size, 1)
                with torch.no_grad():
                    next_val_scaled = model(input_tensor).item()
                
                predicted_scaled.append(next_val_scaled)
                # Slide window
                current_seq = current_seq[1:] + [next_val_scaled]
            
            # 6. Unscale and format results
            metric_predictions = []
            for i, p_scaled in enumerate(predicted_scaled):
                # Clamp prediction to reasonable range based on history (avoid wildly divergent values)
                p_clamped = max(-0.5, min(1.5, p_scaled)) 
                p_unscaled = (p_clamped * scale_range) + min_val
                
                # Create future date (approx 30 days apart for demo)
                future_dt = last_dt + timedelta(days=30 * (i + 1))
                
                metric_predictions.append({
                    "date": future_dt.isoformat(),
                    "value": round(float(p_unscaled), 2),
                    "is_prediction": True,
                    "appointment_number": 999 # Special marker for predictions
                })
            
            predictions[metric_name] = metric_predictions
            print(f"✅ Generated {n_future} LSTM predictions for {metric_name}")

        except Exception as e:
            print(f"⚠️ Error predicting for {metric_name}: {e}")
            continue
            
    return predictions
