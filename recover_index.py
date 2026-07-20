import json

log_path = '/home/netss/.gemini/antigravity-ide/brain/caa235d5-f53b-4299-b7b4-458da3d81086/.system_generated/logs/transcript_full.jsonl'
best = ""

with open(log_path) as f:
    for line in f:
        try:
            step = json.loads(line)
        except:
            continue
            
        if step.get('type') == 'PLANNER_RESPONSE':
            for tc in step.get('tool_calls', []):
                args = tc.get('arguments', {})
                if tc.get('name') in ['default_api:write_to_file', 'default_api:replace_file_content', 'default_api:multi_replace_file_content']:
                    # search for the code
                    if 'index.js' in args.get('TargetFile', ''):
                        code = args.get('CodeContent', '') or args.get('ReplacementContent', '')
                        if len(code) > len(best):
                            best = code
                            
        # Also check if it's in the text response maybe?
        content = step.get('content', '')
        if isinstance(content, str) and 'function renderFrame' in content and len(content) > len(best):
            best = content

if len(best) > 1000:
    with open('index.js.recovered', 'w') as out:
        out.write(best)
    print(f"Recovered {len(best)} chars")
else:
    print("Not found in tool calls. Let's try to extract from raw jsonl.")
