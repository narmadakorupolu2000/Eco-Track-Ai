import pytest
import asyncio
from httpx import AsyncClient
from backend.main import app
from unittest.mock import patch, AsyncMock


@pytest.mark.asyncio
async def test_register_and_login_and_dashboard():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Register user
        resp = await ac.post("/api/auth/register", json={
            "email": "testuser@example.com",
            "username": "testuser",
            "full_name": "Test User",
            "password": "Secur3P@ssw0rd",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data.get("success") is True
        user_id = data.get("user_id")
        assert user_id

        # Login
        resp = await ac.post("/api/auth/token", data={"username": "testuser", "password": "Secur3P@ssw0rd"})
        assert resp.status_code == 200
        token_data = resp.json()
        assert token_data.get("access_token")
        token = token_data["access_token"]

        # Dashboard without token should fail
        resp = await ac.get("/api/user/dashboard")
        assert resp.status_code == 401

        # Dashboard with token
        headers = {"Authorization": f"Bearer {token}"}
        resp = await ac.get("/api/user/dashboard", headers=headers)
        assert resp.status_code == 200
        dd = resp.json()
        assert "user" in dd and "stats" in dd

        # Logout
        resp = await ac.post("/api/auth/logout", headers=headers)
        assert resp.status_code == 200
        assert resp.json().get("success") is True

        # Using token after logout should fail
        resp = await ac.get("/api/user/dashboard", headers=headers)
        assert resp.status_code == 401


@pytest.mark.asyncio
async def test_chat_and_classify_with_gemini_monkeypatch():
    # Patch gemini_client functions to avoid external calls
    with patch("backend.app.utils.gemini_client.generate_text", new=AsyncMock(return_value="Hello from Gemini")):
        with patch("backend.app.utils.gemini_client.classify_image", new=AsyncMock(return_value={
            "category": "Plastic",
            "confidence": 93.5,
            "disposal": "Rinse and recycle",
            "tips": ["Remove cap", "Rinse"],
            "environmental_impact": "Recycling saves energy",
            "points_earned": 15,
        })):
            async with AsyncClient(app=app, base_url="http://test") as ac:
                # register
                await ac.post("/api/auth/register", json={
                    "email": "guser@example.com",
                    "username": "guser",
                    "full_name": "G User",
                    "password": "password123",
                })
                resp = await ac.post("/api/auth/token", data={"username": "guser", "password": "password123"})
                token = resp.json()["access_token"]
                headers = {"Authorization": f"Bearer {token}"}

                # chat
                resp = await ac.post("/api/chat", json={"message": "Hi"}, headers=headers)
                assert resp.status_code == 200
                assert resp.json().get("response") == "Hello from Gemini"

                # classify (multipart)
                files = {"file": ("img.jpg", b"\xff\xd8\xff", "image/jpeg")}
                resp = await ac.post("/api/classify", headers=headers, files=files)
                assert resp.status_code == 200
                body = resp.json()
                assert body["category"] == "Plastic"
                assert body["points_earned"] == 15
