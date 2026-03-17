# python sandbox
FROM python:3.11-slim

# tạo user không phải root
RUN useradd -m sandboxuser

WORKDIR /app

# copy runner
COPY python-engine/runner.py .

# quyền thấp
USER sandboxuser

# chạy runner
CMD ["python", "runner.py"]