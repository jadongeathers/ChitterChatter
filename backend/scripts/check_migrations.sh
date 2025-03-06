#!/bin/bash

echo "Checking if database migrations are needed..."
flask db migrate --message "Checking for missing migrations" > /dev/null 2>&1
if [[ $? -eq 0 ]]; then
  echo "✅ All migrations are applied."
else
  echo "❌ Missing migrations detected! Run 'flask db migrate && flask db upgrade' before committing."
  exit 1
fi
