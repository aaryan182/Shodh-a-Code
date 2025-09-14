-- V6: Insert sample data for testing
-- This migration inserts sample data including 1 contest, 3 problems, and test cases

-- Insert sample users
INSERT INTO users (username, email, created_at) VALUES 
    ('alice_coder', 'alice@example.com', '2024-01-01 10:00:00'),
    ('bob_dev', 'bob@example.com', '2024-01-01 11:00:00'),
    ('charlie_prog', 'charlie@example.com', '2024-01-01 12:00:00');

-- Insert sample contest
INSERT INTO contests (name, description, start_time, end_time, created_at) VALUES 
    ('Sample Programming Contest', 
     'A beginner-friendly programming contest featuring fundamental algorithmic problems. Perfect for practicing basic data structures and algorithms.',
     '2024-09-15 09:00:00',
     '2024-09-15 18:00:00',
     '2024-09-01 10:00:00');

-- Insert sample problems
INSERT INTO problems (contest_id, title, description, difficulty, time_limit, memory_limit, input_format, output_format, constraints) VALUES 
    (1, 'Two Sum',
     'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
     'EASY', 2, 128,
     'The first line contains an integer n (2 ≤ n ≤ 1000), the size of the array. The second line contains n space-separated integers representing the array elements. The third line contains the target integer.',
     'Output two space-separated integers representing the indices (0-based) of the two numbers that add up to the target.',
     '2 ≤ n ≤ 1000, -1000 ≤ nums[i] ≤ 1000, -2000 ≤ target ≤ 2000'),
    
    (1, 'Valid Parentheses',
     'Given a string s containing just the characters ''('', '')'', ''{'', ''}'', ''['' and '']'', determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets. Open brackets must be closed in the correct order. Every close bracket has a corresponding open bracket of the same type.',
     'EASY', 1, 64,
     'A single line containing a string s (1 ≤ |s| ≤ 1000) consisting only of parentheses characters.',
     'Output "true" if the string is valid, "false" otherwise.',
     '1 ≤ |s| ≤ 1000, s consists of parentheses only: ''(){}[]'''),
    
    (1, 'Binary Tree Inorder Traversal',
     'Given the root of a binary tree, return the inorder traversal of its nodes'' values. The tree is represented as a serialized string where null nodes are represented as "null" and values are space-separated.',
     'MEDIUM', 3, 256,
     'The first line contains an integer n (0 ≤ n ≤ 100), the number of nodes. If n > 0, the second line contains the serialized binary tree as space-separated values, where "null" represents a null node.',
     'Output the inorder traversal as space-separated integers on a single line. If the tree is empty, output an empty line.',
     '0 ≤ n ≤ 100, -100 ≤ node.val ≤ 100');

-- Insert test cases for Problem 1: Two Sum
INSERT INTO test_cases (problem_id, input, expected_output, is_hidden) VALUES 
    (1, E'4\n2 7 11 15\n9', '0 1', false),
    (1, E'3\n3 2 4\n6', '1 2', false),
    (1, E'2\n3 3\n6', '0 1', true),
    (1, E'5\n1 5 3 8 2\n10', '1 3', true),
    (1, E'4\n-1 0 1 2\n1', '2 3', true);

-- Insert test cases for Problem 2: Valid Parentheses
INSERT INTO test_cases (problem_id, input, expected_output, is_hidden) VALUES 
    (2, '()', 'true', false),
    (2, '()[]{}', 'true', false),
    (2, '(]', 'false', false),
    (2, '([)]', 'false', true),
    (2, '{[]}', 'true', true),
    (2, '((', 'false', true),
    (2, '))', 'false', true);

-- Insert test cases for Problem 3: Binary Tree Inorder Traversal
INSERT INTO test_cases (problem_id, input, expected_output, is_hidden) VALUES 
    (3, E'3\n1 null 2 null null 3', '1 3 2', false),
    (3, '0', '', false),
    (3, '1\n1', '1', false),
    (3, E'7\n1 2 3 4 5 null 6 null null null null 7', '4 2 7 5 1 3 6', true),
    (3, E'5\n5 3 8 2 4', '2 3 4 5 8', true);

-- Insert sample submissions
INSERT INTO submissions (user_id, problem_id, contest_id, code, language, status, result, score, submitted_at, execution_time, memory_used) VALUES 
    (1, 1, 1, 
     E'def two_sum(nums, target):\n    num_map = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in num_map:\n            return [num_map[complement], i]\n        num_map[num] = i\n    return []\n\n# Read input\nn = int(input())\nnums = list(map(int, input().split()))\ntarget = int(input())\n\n# Solve and print result\nresult = two_sum(nums, target)\nprint(result[0], result[1])',
     'PYTHON', 'ACCEPTED', 'All test cases passed', 100, '2024-09-15 10:30:00', 45, 1024),
    
    (2, 1, 1,
     E'import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) {\n            nums[i] = sc.nextInt();\n        }\n        int target = sc.nextInt();\n        \n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < n; i++) {\n            int complement = target - nums[i];\n            if (map.containsKey(complement)) {\n                System.out.println(map.get(complement) + " " + i);\n                return;\n            }\n            map.put(nums[i], i);\n        }\n    }\n}',
     'JAVA', 'ACCEPTED', 'All test cases passed', 100, '2024-09-15 11:15:00', 120, 2048),
    
    (1, 2, 1,
     E'def is_valid(s):\n    stack = []\n    mapping = {")", "(", "}", "{", "]", "["}\n    \n    for char in s:\n        if char in mapping:\n            if not stack or stack.pop() != mapping[char]:\n                return False\n        else:\n            stack.append(char)\n    \n    return not stack\n\n# Read input\ns = input().strip()\n\n# Solve and print result\nresult = is_valid(s)\nprint("true" if result else "false")',
     'PYTHON', 'ACCEPTED', 'All test cases passed', 100, '2024-09-15 12:00:00', 32, 512),
    
    (3, 1, 1,
     E'#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) {\n        cin >> nums[i];\n    }\n    int target;\n    cin >> target;\n    \n    unordered_map<int, int> numMap;\n    for (int i = 0; i < n; i++) {\n        int complement = target - nums[i];\n        if (numMap.find(complement) != numMap.end()) {\n            cout << numMap[complement] << " " << i << endl;\n            return 0;\n        }\n        numMap[nums[i]] = i;\n    }\n    return 0;\n}',
     'CPP', 'WRONG_ANSWER', 'Failed on test case 3', 60, '2024-09-15 13:30:00', 89, 1536);

-- Add comments for documentation
COMMENT ON TABLE users IS 'Sample users: alice_coder, bob_dev, charlie_prog';
COMMENT ON TABLE contests IS 'Sample contest: Sample Programming Contest (9 hours duration)';
COMMENT ON TABLE problems IS 'Sample problems: Two Sum (Easy), Valid Parentheses (Easy), Binary Tree Inorder Traversal (Medium)';
COMMENT ON TABLE test_cases IS 'Test cases for all sample problems with mix of visible and hidden cases';
COMMENT ON TABLE submissions IS 'Sample submissions showing different statuses and languages';
