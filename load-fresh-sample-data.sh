#!/bin/bash

# Load Fresh Sample Data for Sarla Tea Estate CRM
# This script creates sample data from scratch using API endpoints

set -e  # Exit on error

# Configuration
API_BASE="http://localhost:8080/api"
#API_BASE="https://sarla-estate-production.up.railway.app/api"
CONTENT_TYPE="Content-Type: application/json"

# Login credentials
USERNAME="nklmthr"
PASSWORD="Kedarnath1312"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function to extract ID from JSON response
extract_id() {
    echo "$1" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4
}

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   Loading Sample Data (50 Employees)${NC}"
echo -e "${BLUE}================================================${NC}\n"

# ============================================
# STEP 0: Authenticate and get JWT token
# ============================================
echo -e "${GREEN}STEP 0: Authenticating...${NC}\n"

LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "$CONTENT_TYPE" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

JWT_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$JWT_TOKEN" ]; then
  echo -e "${RED}ERROR: Failed to authenticate. Please check your credentials.${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Authentication successful!${NC}\n"

# Set authorization header for all requests
AUTH_HEADER="Authorization: Bearer $JWT_TOKEN"

# ============================================
# STEP 1: Check and Create Employees
# ============================================
echo -e "${GREEN}STEP 1: Creating Employees (50)...${NC}\n"

# Check if employees already exist
EXISTING_EMPLOYEES=$(curl -s -H "$AUTH_HEADER" "$API_BASE/employees" | grep -o '"id"' | wc -l | tr -d ' ')
if [ "$EXISTING_EMPLOYEES" -ge 50 ]; then
  echo -e "${YELLOW}Found $EXISTING_EMPLOYEES existing employees. Skipping employee creation.${NC}\n"
  # Get first 4 employee IDs for assignments later
  RESPONSE=$(curl -s -H "$AUTH_HEADER" "$API_BASE/employees")
  EMPLOYEE1_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  EMPLOYEE2_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -2 | tail -1 | cut -d'"' -f4)
  EMPLOYEE3_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -3 | tail -1 | cut -d'"' -f4)
  EMPLOYEE4_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -4 | tail -1 | cut -d'"' -f4)
else
  echo "Creating 50 employees with varied data..."
  
  # Array of first names
  FIRST_NAMES=("Ramesh" "Priya" "Suresh" "Anjali" "Rajesh" "Sunita" "Amit" "Kavita" "Vijay" "Meena" 
               "Anil" "Rekha" "Deepak" "Pooja" "Sanjay" "Geeta" "Manoj" "Nisha" "Rakesh" "Asha"
               "Ravi" "Lata" "Vinod" "Suman" "Pankaj" "Rita" "Sunil" "Anita" "Arun" "Neha"
               "Raj" "Madhuri" "Ajay" "Shila" "Prakash" "Seema" "Kiran" "Radha" "Mohan" "Kamla"
               "Gopal" "Bharti" "Dilip" "Sarita" "Shankar" "Lalita" "Mahesh" "Pushpa" "Naresh" "Shanti")
  
  LAST_NAMES=("Kumar" "Sharma" "Patel" "Desai" "Singh" "Gupta" "Verma" "Reddy" "Rao" "Nair")
  
  ID_TYPES=("AADHAAR" "AADHAAR" "AADHAAR" "PAN" "AADHAAR")
  
  # Store employee IDs
  EMPLOYEE_IDS=()
  
  for i in {1..50}; do
    FNAME_IDX=$((i % 50))
    LNAME_IDX=$((i % 10))
    ID_TYPE_IDX=$((i % 5))
    
    NAME="${FIRST_NAMES[$FNAME_IDX]} ${LAST_NAMES[$LNAME_IDX]}"
    PHONE="+91-98765$(printf "%05d" $((43210 + i)))"
    PF_ACCOUNT="PF$(printf "%09d" $((1234567 + i)))"
    
    if [ "${ID_TYPES[$ID_TYPE_IDX]}" == "AADHAAR" ]; then
      ID_VALUE="$(printf "%04d" $((1000 + i)))-$(printf "%04d" $((5000 + i)))-$(printf "%04d" $((9000 + i)))"
    else
      ID_VALUE="ABCD$(printf "%c" $((E + (i % 26))))$(printf "%04d" $((1000 + i)))F"
    fi
    
    RESPONSE=$(curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/employees" \
      -H "$CONTENT_TYPE" \
      -d "{
        \"name\": \"$NAME\",
        \"phone\": \"$PHONE\",
        \"pfAccountId\": \"$PF_ACCOUNT\",
        \"idCardType\": \"${ID_TYPES[$ID_TYPE_IDX]}\",
        \"idCardValue\": \"$ID_VALUE\"
      }")
    
    EMP_ID=$(extract_id "$RESPONSE")
    EMPLOYEE_IDS+=("$EMP_ID")
    
    # Store first 4 for later use
    if [ $i -eq 1 ]; then EMPLOYEE1_ID=$EMP_ID; fi
    if [ $i -eq 2 ]; then EMPLOYEE2_ID=$EMP_ID; fi
    if [ $i -eq 3 ]; then EMPLOYEE3_ID=$EMP_ID; fi
    if [ $i -eq 4 ]; then EMPLOYEE4_ID=$EMP_ID; fi
    
    if [ $((i % 10)) -eq 0 ]; then
      echo -e "  ✓ Created $i employees..."
    fi
  done
  
  echo -e "  ${GREEN}✓ Created all 50 employees${NC}\n"
fi

# ============================================
# STEP 2: Create Employee Salaries
# ============================================
echo -e "${GREEN}STEP 2: Creating Employee Salaries (with varied PF)...${NC}\n"

# Check if salaries already exist
EXISTING_SALARIES=$(curl -s -H "$AUTH_HEADER" "$API_BASE/employee-salaries/active" 2>/dev/null | grep -o '"id"' | wc -l | tr -d ' ')
if [ "$EXISTING_SALARIES" -ge 20 ]; then
  echo -e "${YELLOW}Found $EXISTING_SALARIES existing salaries. Skipping salary creation.${NC}\n"
else
  echo "Creating salaries for all employees with varied amounts and PF percentages..."
  
  # If we just created employees, use the array
  if [ ${#EMPLOYEE_IDS[@]} -gt 0 ]; then
    for i in "${!EMPLOYEE_IDS[@]}"; do
      EMP_ID="${EMPLOYEE_IDS[$i]}"
      
      # Vary salary amounts: 15k-30k
      BASE_AMOUNT=$((15000 + (i * 300)))
      
      # Vary voluntary PF: 0%, 1%, 2%, 3%, 4%, 5%
      VPF_OPTIONS=(0 0 0 1 2 3 4 5)
      VPF_IDX=$((i % 8))
      VPF="${VPF_OPTIONS[$VPF_IDX]}"
      
      curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/employee-salaries/employee/$EMP_ID/initial" \
        -H "$CONTENT_TYPE" \
        -d "{
          \"amount\": $BASE_AMOUNT.00,
          \"currency\": \"INR\",
          \"startDate\": \"2024-01-01\",
          \"voluntaryPfPercentage\": $VPF.00,
          \"reasonForChange\": \"Initial salary\",
          \"notes\": \"Standard base salary with ${VPF}% voluntary PF\"
        }" > /dev/null 2>&1
      
      if [ $((i % 10)) -eq 9 ]; then
        echo -e "  ✓ Created $((i + 1)) salaries..."
      fi
    done
  else
    # If employees already existed, get them and create salaries
    ALL_EMPLOYEES=$(curl -s -H "$AUTH_HEADER" "$API_BASE/employees")
    
    i=0
    while [ $i -lt 50 ]; do
      EMP_ID=$(echo "$ALL_EMPLOYEES" | grep -o '"id":"[^"]*"' | sed -n "$((i+1))p" | cut -d'"' -f4)
      
      if [ -z "$EMP_ID" ]; then
        break
      fi
      
      # Check if salary exists for this employee
      HAS_SALARY=$(curl -s -H "$AUTH_HEADER" "$API_BASE/employee-salaries/employee/$EMP_ID/current" 2>/dev/null | grep -o '"id"' | wc -l | tr -d ' ')
      
      if [ "$HAS_SALARY" -eq 0 ]; then
        BASE_AMOUNT=$((15000 + (i * 300)))
        VPF_OPTIONS=(0 0 0 1 2 3 4 5)
        VPF_IDX=$((i % 8))
        VPF="${VPF_OPTIONS[$VPF_IDX]}"
        
        curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/employee-salaries/employee/$EMP_ID/initial" \
          -H "$CONTENT_TYPE" \
          -d "{
            \"amount\": $BASE_AMOUNT.00,
            \"currency\": \"INR\",
            \"startDate\": \"2024-01-01\",
            \"voluntaryPfPercentage\": $VPF.00,
            \"reasonForChange\": \"Initial salary\",
            \"notes\": \"Standard base salary with ${VPF}% voluntary PF\"
          }" > /dev/null 2>&1
      fi
      
      if [ $((i % 10)) -eq 9 ]; then
        echo -e "  ✓ Processed $((i + 1)) employees..."
      fi
      
      i=$((i + 1))
    done
  fi
  
  echo -e "  ${GREEN}✓ Created salaries for all employees${NC}\n"
fi

# ============================================
# STEP 3: Create Work Activities
# ============================================
echo -e "${GREEN}STEP 3: Creating Work Activities...${NC}\n"

echo "Creating Activity 1: Tea Plucking"
ACTIVITY1_RESPONSE=$(curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/work-activities" \
  -H "$CONTENT_TYPE" \
  -d '{
    "name": "Tea Plucking",
    "description": "Harvesting tea leaves from the plantation",
    "status": "ACTIVE",
    "notes": "Primary activity - seasonal variations apply"
  }')
ACTIVITY1_ID=$(extract_id "$ACTIVITY1_RESPONSE")
echo -e "  ✓ Created: Tea Plucking (ID: ${YELLOW}$ACTIVITY1_ID${NC})\n"

echo "Creating Activity 2: Pruning"
ACTIVITY2_RESPONSE=$(curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/work-activities" \
  -H "$CONTENT_TYPE" \
  -d '{
    "name": "Pruning",
    "description": "Trimming tea plants for better yield",
    "status": "ACTIVE",
    "notes": "Seasonal activity - primarily in winter"
  }')
ACTIVITY2_ID=$(extract_id "$ACTIVITY2_RESPONSE")
echo -e "  ✓ Created: Pruning (ID: ${YELLOW}$ACTIVITY2_ID${NC})\n"

echo "Creating Activity 3: Fertilizer Application"
ACTIVITY3_RESPONSE=$(curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/work-activities" \
  -H "$CONTENT_TYPE" \
  -d '{
    "name": "Fertilizer Application",
    "description": "Applying fertilizers to tea plants",
    "status": "ACTIVE",
    "notes": "Quarterly activity"
  }')
ACTIVITY3_ID=$(extract_id "$ACTIVITY3_RESPONSE")
echo -e "  ✓ Created: Fertilizer Application (ID: ${YELLOW}$ACTIVITY3_ID${NC})\n"

echo "Creating Activity 4: Weeding"
ACTIVITY4_RESPONSE=$(curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/work-activities" \
  -H "$CONTENT_TYPE" \
  -d '{
    "name": "Weeding",
    "description": "Removing weeds from plantation area",
    "status": "ACTIVE",
    "notes": "Regular maintenance activity"
  }')
ACTIVITY4_ID=$(extract_id "$ACTIVITY4_RESPONSE")
echo -e "  ✓ Created: Weeding (ID: ${YELLOW}$ACTIVITY4_ID${NC})\n"

# ============================================
# STEP 4: Create Completion Criteria
# ============================================
echo -e "${GREEN}STEP 4: Creating Completion Criteria (Multiple Periods)...${NC}\n"

# Tea Plucking - Multiple seasonal periods
echo "Tea Plucking Criteria:"

echo "  • Past Period (Inactive): Oct 2024 - Dec 2024"
CRITERIA1=$(curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/work-activities/$ACTIVITY1_ID/completion-criteria" \
  -H "$CONTENT_TYPE" \
  -d '{
    "unit": "KG",
    "value": 25,
    "startDate": "2024-10-01",
    "endDate": "2024-12-31",
    "notes": "Winter season criteria - PAST"
  }')
echo -e "    ✓ Created (${RED}INACTIVE${NC} - past)\n"

echo "  • Current Period (Active): Jan 2025 - Mar 2025"
CRITERIA2=$(curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/work-activities/$ACTIVITY1_ID/completion-criteria" \
  -H "$CONTENT_TYPE" \
  -d '{
    "unit": "KG",
    "value": 30,
    "startDate": "2025-01-01",
    "endDate": "2025-03-31",
    "notes": "Spring season criteria - CURRENT"
  }')
echo -e "    ✓ Created (${GREEN}ACTIVE${NC} - current)\n"

echo "  • Future Period (Inactive): Apr 2025 onwards"
CRITERIA3=$(curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/work-activities/$ACTIVITY1_ID/completion-criteria" \
  -H "$CONTENT_TYPE" \
  -d '{
    "unit": "KG",
    "value": 35,
    "startDate": "2025-04-01",
    "endDate": "",
    "notes": "Peak season criteria - FUTURE (ongoing)"
  }')
echo -e "    ✓ Created (${YELLOW}INACTIVE${NC} - future)\n"

# Pruning - Current active period
echo "Pruning Criteria:"
echo "  • Current Period (Active): Nov 2024 onwards"
curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/work-activities/$ACTIVITY2_ID/completion-criteria" \
  -H "$CONTENT_TYPE" \
  -d '{
    "unit": "PLANTS",
    "value": 50,
    "startDate": "2024-11-01",
    "endDate": "",
    "notes": "Winter pruning - ongoing"
  }' > /dev/null
echo -e "    ✓ Created (${GREEN}ACTIVE${NC} - ongoing)\n"

# Fertilizer Application - Multiple periods
echo "Fertilizer Application Criteria:"

echo "  • Past Period (Inactive): Sep 2024 - Nov 2024"
curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/work-activities/$ACTIVITY3_ID/completion-criteria" \
  -H "$CONTENT_TYPE" \
  -d '{
    "unit": "AREA",
    "value": 1000,
    "startDate": "2024-09-01",
    "endDate": "2024-11-30",
    "notes": "Q3 2024 fertilization - PAST"
  }' > /dev/null
echo -e "    ✓ Created (${RED}INACTIVE${NC} - past)\n"

echo "  • Current Period (Active): Dec 2024 - Feb 2025"
curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/work-activities/$ACTIVITY3_ID/completion-criteria" \
  -H "$CONTENT_TYPE" \
  -d '{
    "unit": "AREA",
    "value": 1200,
    "startDate": "2024-12-01",
    "endDate": "2025-02-28",
    "notes": "Q4 2024 fertilization - CURRENT"
  }' > /dev/null
echo -e "    ✓ Created (${GREEN}ACTIVE${NC} - current)\n"

# Weeding - Long active period
echo "Weeding Criteria:"
echo "  • Current Period (Active): Jan 2025 - Jun 2025"
curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/work-activities/$ACTIVITY4_ID/completion-criteria" \
  -H "$CONTENT_TYPE" \
  -d '{
    "unit": "AREA",
    "value": 500,
    "startDate": "2025-01-01",
    "endDate": "2025-06-30",
    "notes": "First half 2025 weeding"
  }' > /dev/null
echo -e "    ✓ Created (${GREEN}ACTIVE${NC} - current)\n"

# ============================================
# STEP 5: Create Work Assignments
# ============================================
echo -e "${GREEN}STEP 5: Creating Work Assignments...${NC}\n"

# Get today's date
TODAY=$(date +%Y-%m-%d)
YESTERDAY=$(date -v-1d +%Y-%m-%d 2>/dev/null || date -d "yesterday" +%Y-%m-%d)
TWO_DAYS_AGO=$(date -v-2d +%Y-%m-%d 2>/dev/null || date -d "2 days ago" +%Y-%m-%d)

echo "Creating assignments for the past few days..."

# Assignment 1: Tea Plucking - Ramesh (Completed)
echo "  • ${YESTERDAY}: Tea Plucking → Ramesh Kumar"
ASSIGN1=$(curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/work-assignments" \
  -H "$CONTENT_TYPE" \
  -d "{
    \"workActivityId\": \"$ACTIVITY1_ID\",
    \"assignedEmployeeId\": \"$EMPLOYEE1_ID\",
    \"assignmentDate\": \"$YESTERDAY\",
    \"activityName\": \"Tea Plucking\",
    \"activityDescription\": \"Harvesting tea leaves\"
  }")
ASSIGN1_ID=$(extract_id "$ASSIGN1")
curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/work-assignments/$ASSIGN1_ID/update-completion" \
  -H "$CONTENT_TYPE" \
  -d '{"completionPercentage": 95}' > /dev/null
echo -e "    ✓ Assigned and evaluated (95% completion)\n"

# Assignment 2: Tea Plucking - Priya (Completed)
echo "  • ${YESTERDAY}: Tea Plucking → Priya Sharma"
ASSIGN2=$(curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/work-assignments" \
  -H "$CONTENT_TYPE" \
  -d "{
    \"workActivityId\": \"$ACTIVITY1_ID\",
    \"assignedEmployeeId\": \"$EMPLOYEE2_ID\",
    \"assignmentDate\": \"$YESTERDAY\",
    \"activityName\": \"Tea Plucking\",
    \"activityDescription\": \"Harvesting tea leaves\"
  }")
ASSIGN2_ID=$(extract_id "$ASSIGN2")
curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/work-assignments/$ASSIGN2_ID/update-completion" \
  -H "$CONTENT_TYPE" \
  -d '{"completionPercentage": 88}' > /dev/null
echo -e "    ✓ Assigned and evaluated (88% completion)\n"

# Assignment 3: Pruning - Suresh (Completed)
echo "  • ${TWO_DAYS_AGO}: Pruning → Suresh Patel"
ASSIGN3=$(curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/work-assignments" \
  -H "$CONTENT_TYPE" \
  -d "{
    \"workActivityId\": \"$ACTIVITY2_ID\",
    \"assignedEmployeeId\": \"$EMPLOYEE3_ID\",
    \"assignmentDate\": \"$TWO_DAYS_AGO\",
    \"activityName\": \"Pruning\",
    \"activityDescription\": \"Trimming tea plants\"
  }")
ASSIGN3_ID=$(extract_id "$ASSIGN3")
curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/work-assignments/$ASSIGN3_ID/update-completion" \
  -H "$CONTENT_TYPE" \
  -d '{"completionPercentage": 92}' > /dev/null
echo -e "    ✓ Assigned and evaluated (92% completion)\n"

# Assignment 4: Fertilizer Application - Anjali (Completed)
echo "  • ${TWO_DAYS_AGO}: Fertilizer Application → Anjali Desai"
ASSIGN4=$(curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/work-assignments" \
  -H "$CONTENT_TYPE" \
  -d "{
    \"workActivityId\": \"$ACTIVITY3_ID\",
    \"assignedEmployeeId\": \"$EMPLOYEE4_ID\",
    \"assignmentDate\": \"$TWO_DAYS_AGO\",
    \"activityName\": \"Fertilizer Application\",
    \"activityDescription\": \"Applying fertilizers\"
  }")
ASSIGN4_ID=$(extract_id "$ASSIGN4")
curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/work-assignments/$ASSIGN4_ID/update-completion" \
  -H "$CONTENT_TYPE" \
  -d '{"completionPercentage": 100}' > /dev/null
echo -e "    ✓ Assigned and evaluated (100% completion)\n"

# Assignment 5: Weeding - Ramesh (Not yet evaluated)
echo "  • ${TODAY}: Weeding → Ramesh Kumar"
curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/work-assignments" \
  -H "$CONTENT_TYPE" \
  -d "{
    \"workActivityId\": \"$ACTIVITY4_ID\",
    \"assignedEmployeeId\": \"$EMPLOYEE1_ID\",
    \"assignmentDate\": \"$TODAY\",
    \"activityName\": \"Weeding\",
    \"activityDescription\": \"Removing weeds\"
  }" > /dev/null
echo -e "    ✓ Assigned (not yet evaluated)\n"

# Assignment 6: Tea Plucking - Suresh (Not yet evaluated)
echo "  • ${TODAY}: Tea Plucking → Suresh Patel"
curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/work-assignments" \
  -H "$CONTENT_TYPE" \
  -d "{
    \"workActivityId\": \"$ACTIVITY1_ID\",
    \"assignedEmployeeId\": \"$EMPLOYEE3_ID\",
    \"assignmentDate\": \"$TODAY\",
    \"activityName\": \"Tea Plucking\",
    \"activityDescription\": \"Harvesting tea leaves\"
  }" > /dev/null
echo -e "    ✓ Assigned (not yet evaluated)\n"

# Assignment 7: Tea Plucking - Anjali (Not yet evaluated)
echo "  • ${TODAY}: Tea Plucking → Anjali Desai"
curl -s -H "$AUTH_HEADER" -X POST "$API_BASE/work-assignments" \
  -H "$CONTENT_TYPE" \
  -d "{
    \"workActivityId\": \"$ACTIVITY1_ID\",
    \"assignedEmployeeId\": \"$EMPLOYEE4_ID\",
    \"assignmentDate\": \"$TODAY\",
    \"activityName\": \"Tea Plucking\",
    \"activityDescription\": \"Harvesting tea leaves\"
  }" > /dev/null
echo -e "    ✓ Assigned (not yet evaluated)\n"

# ============================================
# Summary
# ============================================
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✓ Sample Data Loaded Successfully!${NC}"
echo -e "${BLUE}================================================${NC}\n"

echo -e "${YELLOW}Summary:${NC}"
echo "  • 50 Employees created (or reused if existing)"
echo "  • 50 Employee Salaries with varied PF configurations (0-5%)"
echo "  • Salary range: ₹15,000 - ₹29,700"
echo "  • 4 Work Activities created"
echo "  • 10 Completion Criteria with various date ranges"
echo "  • 7 Work Assignments (4 evaluated, 3 pending)"
echo ""
echo -e "${YELLOW}Key Features Demonstrated:${NC}"
echo "  • Large employee dataset (50 employees)"
echo "  • Multiple PF configurations (0%, 1%, 2%, 3%, 4%, 5% voluntary)"
echo "  • Past, current, and future completion criteria"
echo "  • Active/Inactive calculation based on date ranges"
echo "  • Completed and pending assignments"
echo "  • Various activity types and units"
echo "  • Idempotent loading (checks for existing data)"
echo ""
echo -e "${GREEN}You can now:${NC}"
echo "  1. View employees and their salary breakdowns"
echo "  2. See active vs inactive completion criteria"
echo "  3. Check daily assignments report"
echo "  4. Generate payment reports with PF calculations"
echo ""
echo -e "${BLUE}================================================${NC}"

