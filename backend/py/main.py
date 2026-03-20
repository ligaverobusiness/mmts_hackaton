from fastapi import FastAPI

app = FastAPI()

@app.get("/py/health")
def health():
    return {"ok": True, "backend": "python"}