FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

# Используем Flask напрямую для разработки вместо Gunicorn
CMD ["python", "app.py"]