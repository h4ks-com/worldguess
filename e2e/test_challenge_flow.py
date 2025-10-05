#!/usr/bin/env python3
"""E2E tests for the challenge flow with webhooks."""

import json
import os
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from threading import Thread

import httpx
from dotenv import load_dotenv

env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

API_BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")

webhook_messages: list[dict] = []


class WebhookHandler(BaseHTTPRequestHandler):
    """HTTP handler for receiving webhook notifications."""

    def do_POST(self) -> None:
        content_length = int(self.headers["Content-Length"])
        post_data = self.rfile.read(content_length)
        webhook_data = json.loads(post_data.decode("utf-8"))

        webhook_messages.append(webhook_data)
        print(f"Webhook received: {webhook_data}")

        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"status": "ok"}')

    def log_message(self, format: str, *args) -> None:
        pass


def start_webhook_server():
    """Start webhook server in background thread."""
    server = HTTPServer(("localhost", 8888), WebhookHandler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def test_challenge_flow():
    """Test the complete challenge flow."""
    print("\n=== Starting Challenge E2E Tests ===\n")

    webhook_messages.clear()
    server = start_webhook_server()
    time.sleep(0.5)

    client = httpx.Client(base_url=API_BASE_URL)
    try:
        print("1. Creating challenge...")
        create_response = client.post(
            "/v1/challenge/create",
            json={
                "latitude": 40.7128,
                "longitude": -74.0060,
                "radius_km": 50.0,
                "size_class": "country",
                "webhook_url": "http://host.docker.internal:8888/webhook",
                "webhook_extra_params": {"challenge_name": "test_challenge"},
            },
        )
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        challenge_data = create_response.json()
        challenge_id = challenge_data["challenge_id"]
        print(f"✓ Challenge created: {challenge_id}")

        print("\n2. Getting challenge details...")
        get_response = client.get(f"/v1/challenge/{challenge_id}")
        assert get_response.status_code == 200, f"Get failed: {get_response.text}"
        details = get_response.json()
        assert details["latitude"] == 40.7128
        assert details["longitude"] == -74.0060
        print(f"✓ Challenge details retrieved: {details}")

        print("\n3. Submitting guesses from multiple users...")
        users = [
            ("Alice", 1000000),
            ("Bob", 2000000),
            ("Charlie", 500000),
        ]

        for username, guess in users:
            guess_response = client.post(
                f"/v1/challenge/{challenge_id}/guess",
                json={"username": username, "guess": guess},
            )
            assert guess_response.status_code == 200, f"Guess failed: {guess_response.text}"
            print(f"✓ {username} submitted guess: {guess:,}")
            time.sleep(0.1)

        initial_webhook_count = len(webhook_messages)
        print(f"\n4. Webhooks received after guesses: {initial_webhook_count}")
        for msg in webhook_messages:
            print(f"  - {msg}")

        assert initial_webhook_count == 3, f"Expected 3 webhooks, got {initial_webhook_count}"

        print("\n5. Testing duplicate username (should fail)...")
        duplicate_response = client.post(
            f"/v1/challenge/{challenge_id}/guess",
            json={"username": "Alice", "guess": 999999},
        )
        assert duplicate_response.status_code == 400, "Duplicate should be rejected"
        print("✓ Duplicate username rejected")

        print("\n6. Ending challenge...")
        end_response = client.post(f"/v1/challenge/{challenge_id}/end")
        assert end_response.status_code == 200, f"End failed: {end_response.text}"
        end_data = end_response.json()
        print("✓ Challenge ended")
        print(f"  Actual population: {end_data['actual_population']:,}")
        print(f"  Rankings: {end_data['rankings']}")

        # Verify actual population is in response
        assert "actual_population" in end_data, "actual_population missing from response"
        assert end_data["actual_population"] > 0, "actual_population should be positive"

        # Verify rankings are correct
        assert len(end_data["rankings"]) == 3, f"Expected 3 rankings, got {len(end_data['rankings'])}"
        assert end_data["rankings"][0]["username"] == "Bob", "Bob should be ranked first"

        # Verify each ranking has score field
        for ranking in end_data["rankings"]:
            assert "score" in ranking, f"Ranking missing score: {ranking}"
            assert ranking["score"] in ["good", "meh", "bad"], f"Invalid score: {ranking['score']}"

        time.sleep(0.5)
        final_webhook_count = len(webhook_messages)
        end_webhooks = final_webhook_count - initial_webhook_count
        print(f"\n7. Webhooks received after ending: {end_webhooks}")
        for msg in webhook_messages[initial_webhook_count:]:
            print(f"  - {msg}")

        # Should have NO webhooks after ending (only 3 from guesses)
        assert end_webhooks == 0, f"Expected 0 end webhooks, got {end_webhooks}"

        print("\n8. Verifying challenge cleanup...")
        cleanup_response = client.get(f"/v1/challenge/{challenge_id}")
        assert cleanup_response.status_code == 404, "Challenge should be deleted"
        print("✓ Challenge successfully cleaned up")

        print("\n=== All Tests Passed! ===\n")
    finally:
        server.shutdown()
        client.close()


if __name__ == "__main__":
    test_challenge_flow()
