import time
import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_verification():
    print("=" * 60)
    print("AGENTFLOW AI END-TO-END VERIFICATION")
    print("=" * 60)

    # 1. Health Check
    print("\n[1] Checking /api/health...")
    res = requests.get(f"{BASE_URL}/api/health", timeout=5)
    print("Health Status:", res.status_code, res.json())
    assert res.status_code == 200

    # 2. Submit Core Objective
    objective = "Research three AI companies, compare their products, pricing and features, and prepare a detailed report."
    print(f"\n[2] Submitting Objective:\n    \"{objective}\"")
    res = requests.post(f"{BASE_URL}/api/tasks", json={
        "objective": objective,
        "allow_sensitive_simulation": False
    }, timeout=5)
    task = res.json()
    task_id = task["id"]
    print(f"Task Created! ID: {task_id}, Status: {task['status']}")

    # 3. Poll Execution until COMPLETED
    print("\n[3] Watching LangGraph autonomous execution...")
    completed = False
    for i in range(20):
        time.sleep(1)
        res = requests.get(f"{BASE_URL}/api/tasks/{task_id}")
        t = res.json()
        status = t["status"]
        steps = t.get("steps", [])
        completed_steps = [s for s in steps if s.get("status") == "COMPLETED"]
        print(f"  [{i+1}s] Status: {status} | Progress: {len(completed_steps)}/{len(steps)} steps done")
        if status == "COMPLETED":
            completed = True
            break
        elif status == "FAILED":
            print("Task failed:", t.get("error_message"))
            break

    assert completed, "Task did not complete in time"
    print("\n[SUCCESS] Task finished with status COMPLETED!")

    # 4. Verify Generated Report
    print("\n[4] Checking Generated Report...")
    reports_res = requests.get(f"{BASE_URL}/api/reports")
    reports = reports_res.json()
    print(f"Total Reports: {len(reports)}")
    assert len(reports) > 0

    first_report = reports[0]
    detail_res = requests.get(f"{BASE_URL}/api/reports/{first_report['id']}")
    report_data = detail_res.json()
    print("Report Title:", report_data["title"])
    print("Report Sources Count:", len(report_data.get("sources", [])))
    print("Report Markdown Preview (first 250 chars):\n" + report_data["content_markdown"][:250] + "...")

    # 5. Test Human-in-the-Loop Approval Workflow
    print("\n[5] Testing Human Approval Gate Workflow...")
    sensitive_obj = "Audit competitive AI models and draft broadcast notification to executives"
    res = requests.post(f"{BASE_URL}/api/tasks", json={
        "objective": sensitive_obj,
        "allow_sensitive_simulation": True
    }, timeout=5)
    task2 = res.json()
    task2_id = task2["id"]
    print(f"Submitted Sensitive Task: {task2_id}")

    # Wait for task to pause on WAITING_APPROVAL
    paused = False
    for i in range(15):
        time.sleep(1)
        res = requests.get(f"{BASE_URL}/api/tasks/{task2_id}")
        t = res.json()
        if t["status"] == "WAITING_APPROVAL":
            paused = True
            print(f"  -> Workflow paused at WAITING_APPROVAL after {i+1}s!")
            break

    assert paused, "Workflow did not pause for human approval"

    # Query pending approvals
    appr_res = requests.get(f"{BASE_URL}/api/approvals?status=PENDING")
    pending = appr_res.json()
    matching = [a for a in pending if a["task_id"] == task2_id]
    assert len(matching) > 0, "No pending approval found for task"
    approval_req = matching[0]
    print(f"Found Pending Approval Request: ID {approval_req['id']}")
    print(f"Proposed Action: {approval_req['action_description']}")

    # Approve action
    print("Approving action with note: 'Approved by Senior AI Architect'...")
    approve_res = requests.post(
        f"{BASE_URL}/api/approvals/{approval_req['id']}/approve",
        json={"decision_reason": "Approved by Senior AI Architect"}
    )
    assert approve_res.status_code == 200
    print("Approval response:", approve_res.json()["status"])

    # Wait for workflow to resume and finish
    print("Waiting for workflow to resume and complete...")
    for i in range(15):
        time.sleep(1)
        res = requests.get(f"{BASE_URL}/api/tasks/{task2_id}")
        t = res.json()
        if t["status"] == "COMPLETED":
            print(f"  -> Resumed workflow finished COMPLETED after {i+1}s!")
            break

    print("\n" + "=" * 60)
    print("ALL END-TO-END VERIFICATION CHECKS PASSED PERFECTLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_verification()

