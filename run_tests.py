#!/usr/bin/env python
"""
Test runner for FraudShield AI Mathematical Intelligence Engine
"""
import sys
import subprocess
from pathlib import Path


def run_tests():
    """Run every project test from this checkout."""
    root = Path(__file__).resolve().parent
    result = subprocess.run(
        [sys.executable, "-m", "pytest", "tests", "-v", "--tb=short"],
        cwd=root,
    )
    return result.returncode == 0


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)