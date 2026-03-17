import sys
import json
import signal

def timeout_handler(signum, frame):
    raise Exception("Execution timeout")

signal.signal(signal.SIGALRM, timeout_handler)


def safe_exec(code, state):
    local_vars = {}

    safe_builtins = {
        "range": range,
        "len": len,
        "min": min,
        "max": max,
        "sum": sum,
        "abs": abs
    }

    dangerous = ["__", "import", "open", "exec", "eval", "os", "sys"]

    for word in dangerous:
        if word in code:
            return {"error": f"Forbidden keyword: {word}"}

    try:
        signal.alarm(1)

        exec(code, {"__builtins__": safe_builtins}, local_vars)

        if "action" not in local_vars:
            return {"error": "No action function"}

        result = local_vars["action"](state)

        signal.alarm(0)

        if not isinstance(result, dict):
            return {"error": "Invalid return format"}

        return {"result": result}

    except Exception as e:
        return {"error": str(e)}


# 🔥 LOOP CHÍNH
while True:
    try:
        line = sys.stdin.readline()

        if not line:
            break

        data = json.loads(line.strip())

        code = data.get("code", "")
        state = data.get("state", {})

        output = safe_exec(code, state)

        print(json.dumps(output), flush=True)

    except Exception as e:
        print(json.dumps({"error": str(e)}), flush=True)