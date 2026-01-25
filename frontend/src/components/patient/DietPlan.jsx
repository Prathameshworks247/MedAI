import React from 'react';
import { Apple, CheckCircle, XCircle, Lightbulb, Download } from 'lucide-react';
import { dietRecommendations } from '../../data/dummyData';

const DietPlan = () => {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Diet Plan</h2>
        <p className="text-gray-600 dark:text-gray-400">Personalized nutrition recommendations for your heart health</p>
      </div>

      {/* Overview */}
      <div className="card mb-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-200 dark:border-green-700 hover:shadow-xl transition-all duration-200">
        <div className="flex items-start space-x-3">
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-md">
            <Apple className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Heart-Healthy Diet Plan</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{dietRecommendations.general}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Recommended Foods */}
        <div className="card border-2 border-green-200 dark:border-green-700 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div className="flex items-center space-x-2 mb-4">
            <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-xl shadow-md">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recommended Foods</h3>
          </div>
          <div className="space-y-2">
            {dietRecommendations.recommended.map((food, index) => (
              <div key={index} className="flex items-start space-x-2 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-800 dark:text-gray-200">{food}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Foods to Avoid */}
        <div className="card border-2 border-red-200 dark:border-red-700 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div className="flex items-center space-x-2 mb-4">
            <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-xl shadow-md">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Foods to Avoid</h3>
          </div>
          <div className="space-y-2">
            {dietRecommendations.avoid.map((food, index) => (
              <div key={index} className="flex items-start space-x-2 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-800 dark:text-gray-200">{food}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dietary Tips */}
      <div className="card mb-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 hover:shadow-xl transition-all duration-200">
        <div className="flex items-start space-x-3 mb-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-xl shadow-md">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Important Dietary Tips</h3>
        </div>
        <div className="space-y-3">
          {dietRecommendations.tips.map((tip, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-blue-200 dark:border-blue-600">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                <span className="text-white text-xs font-bold">{index + 1}</span>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200 flex-1">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sample Meal Plan */}
      <div className="card mb-6 hover:shadow-xl transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Sample Daily Meal Plan</h3>
          <button className="btn-secondary text-sm flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Download Plan
          </button>
        </div>

        <div className="space-y-4">
          {/* Breakfast */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all">
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-orange-100 dark:bg-orange-900/40 px-3 py-1 rounded-full">
                <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">Breakfast (8:00 AM)</span>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• 1 bowl of oatmeal with fresh berries</li>
              <li>• 1 glass of low-fat milk</li>
              <li>• 1 banana</li>
              <li>• Green tea</li>
            </ul>
          </div>

          {/* Mid-Morning Snack */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all">
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-yellow-100 dark:bg-yellow-900/40 px-3 py-1 rounded-full">
                <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">Mid-Morning (11:00 AM)</span>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• Handful of almonds and walnuts</li>
              <li>• 1 apple</li>
            </ul>
          </div>

          {/* Lunch */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all">
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-green-100 dark:bg-green-900/40 px-3 py-1 rounded-full">
                <span className="text-sm font-semibold text-green-700 dark:text-green-300">Lunch (1:00 PM)</span>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• 2 chapatis (whole wheat)</li>
              <li>• 1 cup dal (lentils)</li>
              <li>• Mixed vegetable curry</li>
              <li>• Green salad with lemon dressing</li>
              <li>• Buttermilk (low-fat)</li>
            </ul>
          </div>

          {/* Evening Snack */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all">
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-purple-100 dark:bg-purple-900/40 px-3 py-1 rounded-full">
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">Evening (5:00 PM)</span>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• Green tea</li>
              <li>• 2-3 whole grain crackers</li>
            </ul>
          </div>

          {/* Dinner */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all">
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-blue-100 dark:bg-blue-900/40 px-3 py-1 rounded-full">
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Dinner (7:30 PM)</span>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• Grilled fish or chicken breast (150g)</li>
              <li>• 1 cup brown rice</li>
              <li>• Steamed vegetables (broccoli, carrots, beans)</li>
              <li>• Clear vegetable soup</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Hydration Reminder */}
      <div className="card bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-700 hover:shadow-xl transition-all duration-200">
        <div className="flex items-start space-x-3">
          <div className="text-4xl">💧</div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Stay Hydrated</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Aim to drink 8-10 glasses (2-2.5 liters) of water throughout the day.
              Proper hydration is essential for heart health and medication effectiveness.
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-400 font-semibold">
              Pro tip: Keep a water bottle with you at all times!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DietPlan;
