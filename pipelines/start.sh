#!/bin/bash
set -ex

poetry run python main.py
sleep 5
echo "Done with all pipelines"
