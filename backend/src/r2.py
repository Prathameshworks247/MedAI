from typing import BinaryIO
import boto3

from src.config import R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET, R2_PUBLIC_URL

r2_client = boto3.client(
	"s3",
	endpoint_url=R2_ENDPOINT,
	aws_access_key_id=R2_ACCESS_KEY,
	aws_secret_access_key=R2_SECRET_KEY,
	region_name="auto"
)

def upload_to_r2(file_content: BinaryIO, file_name: str):
	try:
		r2_client.upload_fileobj(
			file_content,
			R2_BUCKET,
			file_name,
			ExtraArgs={
				"ContentType": "application/octet-stream"
			}
		)
		return f"{R2_PUBLIC_URL}/{file_name}"
	except Exception as e:
		print(f"Error uploading file to R2: {e}")
		return None

