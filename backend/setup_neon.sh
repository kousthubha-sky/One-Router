#!/bin/bash

# Database setup script for Neon
# Run this after setting up your Neon database

# 1. Install dependencies (if not already done)
pip install -r requirements.txt

# 2. Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo "Loaded DATABASE_URL from .env file"
else
    echo "Warning: .env file not found. Please ensure DATABASE_URL is set."
fi

# 3. Run the initial migration
python -m alembic upgrade head

# 4. Verify the tables were created
python -c "
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def check_tables():
    engine = create_async_engine(os.getenv('DATABASE_URL'))
    async with engine.connect() as conn:
        result = await conn.execute(text(\"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'\"))
        tables = result.fetchall()
        print('Created tables:')
        for table in tables:
            print(f'  - {table[0]}')
    await engine.dispose()

import asyncio
asyncio.run(check_tables())
"

echo "Database setup complete!"
echo "You can now run the FastAPI server with: python main.py"