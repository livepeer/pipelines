#!/bin/bash

REPO="livepeer/pipelines"

while IFS='=' read -r key value
do
  clean_value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')

  if [[ -n "$clean_value" ]]; then
    echo "Uploading secret: $key"
    gh secret set "$key" --body "$clean_value" --repo "$REPO"
  else
    echo "Skipping $key (empty value)"
  fi
done < apps/app/.env
