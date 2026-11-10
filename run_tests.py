#!/usr/bin/env python
"""
Test runner for FraudShield AI Mathematical Intelligence Engine
"""
import sys
import subprocess


def run_tests():
    """Run all tests with coverage."""
    test_files = [
        "tests/test_graph.py",
    ]
    
    for test_file in test_files:
        print(f"\n{'='*60}")
        print(f"Running {test_file}")
        print(f"{'='*60}")
        
        result = subprocess.run(
            [sys.executable, "-m", "pytest", test_file, "-v", "--tb=short"],
            cwd="C:\\Users\\Somesh R U\\eclipse-workspace\\BloodBankManagementSystem\\src\\bloodbank\\fraudshield ai"
        )
        
        if result.returncode != 0:
            print(f"FAILED: {test_file}")
            return False
    
    print("\n" + "="*60)
    print("ALL TESTS PASSED")
    print("="*60)
    return True


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)