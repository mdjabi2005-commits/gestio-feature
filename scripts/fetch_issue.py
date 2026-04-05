import subprocess
import json
import sys
import os

def fetch_issue(issue_number):
    try:
        # Run gh command to get issue body in JSON format
        result = subprocess.run(
            ["gh", "issue", "view", str(issue_number), "--json", "body"],
            capture_output=True,
            text=True,
            encoding='utf-8',
            check=True
        )
        
        data = json.loads(result.stdout)
        body = data.get("body", "")
        
        # Save to a clean markdown file with UTF-8 encoding
        filename = f"issue_{issue_number}.md"
        with open(filename, "w", encoding="utf-8") as f:
            f.write(body)
            
        print(f"Successfully fetched issue #{issue_number} into {filename}")
        return filename
    except subprocess.CalledProcessError as e:
        print(f"Error fetching issue: {e.stderr}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python fetch_issue.py <issue_number>")
    else:
        fetch_issue(sys.argv[1])
