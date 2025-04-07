#!/bin/bash

REPO="livepeer/pipelines"

while IFS='=' read -r key value
do
  if [[ -n "$key" && -n "$value" ]]; then
    echo "Uploading $key..."
    gh secret set "$key" --body "$value" --repo "$REPO"
  fi
done < apps/app/.env
