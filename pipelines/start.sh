#!/bin/bash
set -ex

uv run python main.py
sleep 5
echo "Done with all pipelines"
