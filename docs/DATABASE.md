# Trainoryx — Database Specification

**Document:** Database Reference  
**Project:** Trainoryx  
**Version:** 1.0  
**Status:** Implemented Baseline — Prisma schema validated; initial migration applied and verified
**Database:** PostgreSQL  
**ORM:** Prisma ORM 7  
**Database Name:** trainoryx_v2

---

## 1. Purpose

This document defines the database structure and data-management rules for Trainoryx.

It serves as the reference for:

- Prisma schema implementation.
- Database relationships.
- Field definitions and data types.
- Indexes and constraints.
- Data ownership and authorization.
- Historical record preservation.
- Database migrations.
- Validation and integrity requirements.

The Prisma schema must follow this specification unless an intentional change is reviewed and approved.

The approved schema is implemented in `prisma/schema.prisma` and has passed Prisma validation. The initial migration is present and applied to the Neon `trainoryx_v2` database. This document remains the approved contract; the actual Prisma schema and applied migrations define the implemented structure.

---

## 2. Database Principles

Trainoryx uses PostgreSQL through Neon and Prisma ORM.

### 2.1 General Rules

- Use UUID primary keys.
- Use explicit foreign-key relationships.
- Use appropriate database indexes.
- Use Decimal for measurements and precise nutritional values.
- Use integers for calories, macro targets, counts, and durations where appropriate.
- Use UTC timestamps for stored date-time values.
- Preserve IANA timezone identifiers for scheduling.
- Validate external data before database writes.
- Use transactions for operations involving multiple related records.
- Preserve historical assignments using snapshots.
- Prefer relational columns over unnecessary JSON fields.

### 2.2 Naming Convention

Prisma models and fields use PascalCase and camelCase.

PostgreSQL tables and columns use snake_case through Prisma mapping.

Example:

Prisma:
`ClientProfile.fullName`

PostgreSQL:
`client_profiles.full_name`

### 2.3 Identifiers

Primary keys use:

- Prisma type: `String`
- PostgreSQL type: `UUID`
- Default: `uuid()`

### 2.4 Timestamp Policy

Use PostgreSQL `Timestamptz(3)` for date-time fields.

Use PostgreSQL `Date` for calendar-only dates such as assignment start dates and client birth dates.

Store event timestamps in UTC. Convert them for presentation using the coach's IANA timezone.

### 2.5 Numeric Precision

Recommended starting precision:

| Data | PostgreSQL Type |
|---|---|
| Weight | Decimal(7,2) |
| Muscle mass | Decimal(7,2) |
| Body fat percentage | Decimal(5,2) |
| Body measurements | Decimal(7,2) |
| Height | Decimal(6,2) |
| Food quantity | Decimal(8,3) |
| Food macros | Decimal(8,2) |
| Serving weight | Decimal(8,2) |

These precision choices must be reviewed against application validation before migrations are generated.

---

## 3. Application Data Ownership

Trainoryx is a coach-only application.

There is one authenticated application user type: Coach.

Clients are records managed by coaches and do not have application accounts.

### 3.1 Ownership Rules

- Every client belongs to one coach.
- Every training program belongs to one coach.
- Every meal plan belongs to one coach.
- Every food item belongs to one coach.
- Every schedule event belongs to one coach.
- Coach notes and coaching adjustments belong to one coach and one client.
- Client-related operations must verify ownership on the server.

The authenticated coach ID must come from verified Firebase identity and the corresponding database User record.

Never trust a coach ID supplied by the browser as proof of ownership.

### 3.2 Cross-Record Ownership

When assigning a training program or meal plan to a client:

1. Verify the authenticated coach.
2. Verify that the client belongs to that coach.
3. Verify that the program or meal plan belongs to that coach.
4. Execute the assignment only after all checks pass.

The same principle applies to food items added to meal plans.

Application-level checks are mandatory. Where practical, database constraints should reinforce important ownership relationships.

---

## 4. Database Model Inventory

The initial database contains 18 models.

| # | Model | Responsibility |
|---|---|---|
| 1 | User | Coach identity and settings |
| 2 | ClientProfile | Managed client records |
| 3 | TrainingProgram | Reusable training programs |
| 4 | WorkoutDay | Workout days within programs |
| 5 | WorkoutExercise | Exercises within workout days |
| 6 | ProgramAssignment | Training programs assigned to clients |
| 7 | NutritionProfile | Client calorie and macro targets |
| 8 | FoodItem | Coach-managed food library |
| 9 | MealPlan | Reusable nutrition plans |
| 10 | Meal | Meals within meal plans |
| 11 | MealFood | Food entries within meals |
| 12 | MealPlanAssignment | Nutrition plans assigned to clients |
| 13 | Measurement | Historical body measurements |
| 14 | CheckIn | Coach-recorded progress check-ins |
| 15 | ScheduleEvent | Coach calendar events |
| 16 | AvailabilityRule | Coach weekly availability |
| 17 | CoachNote | Private client notes |
| 18 | CoachingAdjustment | Training and nutrition changes |

---

## 5. Model Specifications

### 5.1 User

**Purpose:** Represents the authenticated coach.

Fields:

| Field | Type | Rules |
|---|---|---|
| id | UUID | Primary key |
| firebaseUid | String | Required, unique |
| email | String | Required, unique |
| displayName | String | Required |
| timezone | String | Default Asia/Manila |
| createdAt | Timestamptz | Automatically created |
| updatedAt | Timestamptz | Automatically updated |

Relationships:

- One coach has many clients.
- One coach has many training programs.
- One coach has many meal plans.
- One coach has many food items.
- One coach has many schedule events.
- One coach has many availability rules.
- One coach has many notes.
- One coach has many coaching adjustments.

Rules:

- Firebase UID must be unique.
- Email must be normalized to lowercase before saving.
- No client authentication or role field is required.
- Firebase credentials must never be stored in this table.

### 5.2 ClientProfile

**Purpose:** Stores a coach-managed client profile.

Fields:

| Field | Type | Rules |
|---|---|---|
| id | UUID | Primary key |
| coachId | UUID | Required owner |
| fullName | String | Required |
| email | String | Optional |
| phone | String | Optional |
| dateOfBirth | Date | Optional |
| sex | ClientSex | Optional |
| heightCm | Decimal(6,2) | Optional |
| primaryGoal | String | Optional |
| experienceLevel | ExperienceLevel | Optional |
| status | ClientStatus | Default ACTIVE |
| createdAt | Timestamptz | Automatically created |
| updatedAt | Timestamptz | Automatically updated |

Relationships:

- Belongs to one User.
- Has zero or one NutritionProfile.
- Has many ProgramAssignments.
- Has many MealPlanAssignments.
- Has many Measurements.
- Has many CheckIns.
- Has many ScheduleEvents.
- Has many CoachNotes.
- Has many CoachingAdjustments.

Rules:

- Every client must belong to one coach.
- A client cannot belong to multiple coaches.
- Client records are deactivated instead of casually deleted.
- Historical records must remain accessible to their owner.
- Client email is not an authentication identifier.

### 5.3 TrainingProgram

**Purpose:** Stores reusable workout programs.

Fields:

| Field | Type | Rules |
|---|---|---|
| id | UUID | Primary key |
| coachId | UUID | Required owner |
| name | String | Required |
| description | String | Optional |
| goal | String | Optional |
| experienceLevel | ExperienceLevel | Optional |
| durationWeeks | Int | Optional |
| status | ProgramStatus | Default DRAFT |
| createdAt | Timestamptz | Automatically created |
| updatedAt | Timestamptz | Automatically updated |

Relationships:

- Belongs to one coach.
- Has many WorkoutDays.
- Has many ProgramAssignments.

Rules:

- A program must belong to its creating coach.
- Templates with historical assignments should be archived instead of deleted.
- Editing a reusable program must not silently change existing assignments.

### 5.4 WorkoutDay

**Purpose:** Represents a workout day inside a training program.

Fields:

| Field | Type | Rules |
|---|---|---|
| id | UUID | Primary key |
| programId | UUID | Required |
| name | String | Required |
| sortOrder | Int | Required |

Relationships:

- Belongs to one TrainingProgram.
- Has many WorkoutExercises.

Rules:

- Sort order must be unique within the same program.
- Deleting a program may cascade to its unassigned workout-day children only when deletion restrictions permit.

### 5.5 WorkoutExercise

**Purpose:** Represents an exercise within a workout day.

Fields:

| Field | Type | Rules |
|---|---|---|
| id | UUID | Primary key |
| workoutDayId | UUID | Required |
| name | String | Required |
| sets | Int | Required |
| repMin | Int | Required |
| repMax | Int | Required |
| restSeconds | Int | Optional |
| targetWeightKg | Decimal(7,2) | Optional |
| instructions | String | Optional |
| sortOrder | Int | Required |

Relationships:

- Belongs to one WorkoutDay.

Rules:

- Sets must be greater than zero.
- Rep minimum must be positive.
- Rep maximum must be greater than or equal to rep minimum.
- Rest time cannot be negative.
- Target weight cannot be negative.
- Sort order must be unique within the same workout day.

### 5.6 ProgramAssignment

**Purpose:** Records a training program assigned to a client.

Fields:

| Field | Type | Rules |
|---|---|---|
| id | UUID | Primary key |
| programId | UUID | Required |
| clientId | UUID | Required |
| assignedAt | Timestamptz | Default now |
| startDate | Date | Optional |
| endDate | Date | Optional |
| status | AssignmentStatus | Default ACTIVE |
| isPrimary | Boolean | Default false |
| snapshotVersion | Int | Default 1 |
| programSnapshot | JSON | Required |

Relationships:

- Belongs to one TrainingProgram.
- Belongs to one ClientProfile.

Rules:

- Program and client must belong to the same coach.
- Multiple active programs are allowed.
- A client may have one primary active program.
- Promoting a new primary program must demote the previous primary in the same transaction.
- Only one primary ACTIVE assignment is allowed per client.
- Assignment snapshots preserve the assigned program content.
- Template edits must not silently modify existing assignment snapshots.
- Start date must not occur after end date when both are supplied.

Primary assignment constraint:

A PostgreSQL partial unique index must enforce one primary active training assignment per client.

Conceptual condition:

`is_primary = true AND status = 'ACTIVE'`

The exact migration SQL must be reviewed and tested.

### 5.7 NutritionProfile

**Purpose:** Stores the client's current calorie and macro targets.

Fields:

| Field | Type | Rules |
|---|---|---|
| id | UUID | Primary key |
| clientId | UUID | Required, unique |
| calorieTarget | Int | Required |
| proteinTarget | Int | Required |
| carbsTarget | Int | Required |
| fatTarget | Int | Required |
| updatedAt | Timestamptz | Automatically updated |

Relationships:

- Belongs to one ClientProfile.

Rules:

- A client has at most one current NutritionProfile.
- Targets cannot be negative.
- Use integer values for calorie and gram targets.
- Historical changes should be recorded through CoachingAdjustment when relevant.

### 5.8 FoodItem

**Purpose:** Stores the coach-managed food library.

Fields:

| Field | Type | Rules |
|---|---|---|
| id | UUID | Primary key |
| coachId | UUID | Required owner |
| name | String | Required |
| servingLabel | String | Required |
| servingGrams | Decimal(8,2) | Optional |
| caloriesPerServing | Int | Required |
| proteinG | Decimal(8,2) | Required |
| carbsG | Decimal(8,2) | Required |
| fatG | Decimal(8,2) | Required |
| isArchived | Boolean | Default false |
| createdAt | Timestamptz | Automatically created |
| updatedAt | Timestamptz | Automatically updated |

Relationships:

- Belongs to one coach.
- Has many MealFoods.

Rules:

- Food items belong to the coach who created them.
- Nutritional values are defined per serving.
- Nutritional values cannot be negative.
- Archived food items remain available to historical meal plans.
- Food items referenced by meal entries must not be hard-deleted.

### 5.9 MealPlan

**Purpose:** Stores reusable nutrition plans.

Fields:

| Field | Type | Rules |
|---|---|---|
| id | UUID | Primary key |
| coachId | UUID | Required owner |
| name | String | Required |
| description | String | Optional |
| goal | String | Optional |
| durationWeeks | Int | Optional |
| targetCalories | Int | Optional |
| targetProtein | Int | Optional |
| targetCarbs | Int | Optional |
| targetFat | Int | Optional |
| status | MealPlanStatus | Default DRAFT |
| createdAt | Timestamptz | Automatically created |
| updatedAt | Timestamptz | Automatically updated |

Relationships:

- Belongs to one coach.
- Has many Meals.
- Has many MealPlanAssignments.

Rules:

- A meal plan belongs to one coach.
- Templates with historical assignments should be archived.
- Editing a reusable plan must not silently modify existing assignments.

### 5.10 Meal

**Purpose:** Represents an individual meal within a meal plan.

Fields:

| Field | Type | Rules |
|---|---|---|
| id | UUID | Primary key |
| mealPlanId | UUID | Required |
| name | String | Required |
| sortOrder | Int | Required |

Relationships:

- Belongs to one MealPlan.
- Has many MealFoods.

Rules:

- Sort order must be unique within a meal plan.

### 5.11 MealFood

**Purpose:** Represents a food item and quantity inside a meal.

Fields:

| Field | Type | Rules |
|---|---|---|
| id | UUID | Primary key |
| mealId | UUID | Required |
| foodItemId | UUID | Required |
| quantity | Decimal(8,3) | Required |
| foodNameSnapshot | String | Required |
| servingLabelSnapshot | String | Required |
| servingGramsSnapshot | Decimal(8,2) | Optional |
| caloriesPerServingSnapshot | Int | Required |
| proteinPerServingSnapshot | Decimal(8,2) | Required |
| carbsPerServingSnapshot | Decimal(8,2) | Required |
| fatPerServingSnapshot | Decimal(8,2) | Required |

Relationships:

- Belongs to one Meal.
- References one FoodItem.

Rules:

- Quantity represents the number of servings.
- Quantity must be greater than zero.
- Food items must belong to the same coach as the meal plan owner.
- Snapshot values preserve the historical food name, serving description, and nutritional values.
- Editing a FoodItem must not silently change historical meal-plan content.
- The same FoodItem should not appear twice in the same Meal; update its quantity instead.

### 5.12 MealPlanAssignment

**Purpose:** Records a nutrition plan assigned to a client.

Fields:

| Field | Type | Rules |
|---|---|---|
| id | UUID | Primary key |
| mealPlanId | UUID | Required |
| clientId | UUID | Required |
| startDate | Date | Optional |
| endDate | Date | Optional |
| status | AssignmentStatus | Default ACTIVE |
| isPrimary | Boolean | Default false |
| snapshotVersion | Int | Default 1 |
| mealPlanSnapshot | JSON | Required |
| createdAt | Timestamptz | Automatically created |

Relationships:

- Belongs to one MealPlan.
- Belongs to one ClientProfile.

Rules:

- Meal plan and client must belong to the same coach.
- Multiple active meal plans are allowed.
- A client may have one primary active meal plan.
- Promoting a new primary must demote the previous primary in the same transaction.
- Only one primary ACTIVE meal plan assignment is allowed per client.
- Snapshots preserve historical assigned content.
- Start date must not occur after end date when both are supplied.

Primary assignment constraint:

A PostgreSQL partial unique index must enforce one primary active meal plan per client.

Conceptual condition:

`is_primary = true AND status = 'ACTIVE'`

The exact migration SQL must be reviewed and tested.

### 5.13 Measurement

**Purpose:** Stores independent body measurement records.

Fields:

| Field | Type | Rules |
|---|---|---|
| id | UUID | Primary key |
| clientId | UUID | Required |
| recordedAt | Timestamptz | Required |
| weightKg | Decimal(7,2) | Optional |
| bodyFatPercent | Decimal(5,2) | Optional |
| muscleMassKg | Decimal(7,2) | Optional |
| chestCm | Decimal(7,2) | Optional |
| waistCm | Decimal(7,2) | Optional |
| hipsCm | Decimal(7,2) | Optional |
| armCm | Decimal(7,2) | Optional |
| thighCm | Decimal(7,2) | Optional |
| createdAt | Timestamptz | Automatically created |

Relationships:

- Belongs to one ClientProfile.
- May be linked to one CheckIn.

Rules:

- Measurements may exist without a formal check-in.
- At least one measurement value must be supplied.
- All supplied measurement values must be within approved validation ranges.
- Records should be preserved as historical data.
- Measurements must be scoped to the owning coach through the client relationship.

### 5.14 CheckIn

**Purpose:** Stores a coach-recorded client progress review.

Fields:

| Field | Type | Rules |
|---|---|---|
| id | UUID | Primary key |
| clientId | UUID | Required |
| measurementId | UUID | Optional, unique |
| checkInDate | Timestamptz | Required |
| summary | String | Optional |
| status | CheckInStatus | Default DRAFT |
| createdAt | Timestamptz | Automatically created |
| updatedAt | Timestamptz | Automatically updated |

Relationships:

- Belongs to one ClientProfile.
- May reference one Measurement.

Rules:

- Check-ins are recorded by the coach.
- A check-in may exist without a measurement.
- A measurement may exist without a check-in.
- A measurement may be linked to at most one check-in.
- The linked measurement must belong to the same client.
- Draft and completed states must be handled explicitly.

### 5.15 ScheduleEvent

**Purpose:** Stores coach calendar events.

Fields:

| Field | Type | Rules |
|---|---|---|
| id | UUID | Primary key |
| coachId | UUID | Required owner |
| clientId | UUID | Optional |
| title | String | Required |
| description | String | Optional |
| type | ScheduleEventType | Required |
| startAt | Timestamptz | Required |
| endAt | Timestamptz | Required |
| timezone | String | Required IANA timezone |
| status | ScheduleEventStatus | Default SCHEDULED |
| createdAt | Timestamptz | Automatically created |
| updatedAt | Timestamptz | Automatically updated |

Relationships:

- Belongs to one coach.
- May belong to one client.

Rules:

- Client association is optional for coach-only events.
- An associated client must belong to the event's coach.
- End time must occur after start time.
- Store timestamps in UTC.
- Preserve the event timezone.
- Canceled events should remain in history rather than being casually deleted.

### 5.16 AvailabilityRule

**Purpose:** Stores recurring weekly coach availability.

Fields:

| Field | Type | Rules |
|---|---|---|
| id | UUID | Primary key |
| coachId | UUID | Required owner |
| weekday | Int | Monday 1 through Sunday 7 |
| startMinute | Int | Minutes after midnight |
| endMinute | Int | Minutes after midnight |
| isActive | Boolean | Default true |
| createdAt | Timestamptz | Automatically created |
| updatedAt | Timestamptz | Automatically updated |

Relationships:

- Belongs to one coach.

Rules:

- Weekday must be between 1 and 7.
- Start minute must be at least 0.
- End minute must be at most 1440.
- End minute must be greater than start minute.
- Overnight availability should be represented by separate rules.
- Overlapping active rules for the same coach and weekday should be rejected.
- Availability is interpreted using the coach's timezone.

### 5.17 CoachNote

**Purpose:** Stores private coach notes about clients.

Fields:

| Field | Type | Rules |
|---|---|---|
| id | UUID | Primary key |
| coachId | UUID | Required owner |
| clientId | UUID | Required |
| title | String | Required |
| content | String | Required |
| createdAt | Timestamptz | Automatically created |
| updatedAt | Timestamptz | Automatically updated |

Relationships:

- Belongs to one coach.
- Belongs to one client.

Rules:

- Notes are private to the owning coach.
- Client must belong to the note's coach.
- Notes must never be exposed through unauthenticated endpoints.
- Historical notes should be preserved.

### 5.18 CoachingAdjustment

**Purpose:** Records coaching decisions and changes.

Fields:

| Field | Type | Rules |
|---|---|---|
| id | UUID | Primary key |
| coachId | UUID | Required owner |
| clientId | UUID | Required |
| category | AdjustmentCategory | Required |
| title | String | Required |
| details | String | Optional |
| reason | String | Optional |
| previousValues | JSON | Optional |
| newValues | JSON | Optional |
| effectiveAt | Timestamptz | Required |
| createdAt | Timestamptz | Automatically created |

Relationships:

- Belongs to one coach.
- Belongs to one client.

Rules:

- Category is TRAINING or NUTRITION.
- Client must belong to the adjustment's coach.
- JSON values must be validated with Zod.
- JSON must contain structured values, not arbitrary unvalidated client input.
- Adjustments preserve the history of coaching decisions.

---

### Coach Account Provisioning

- Firebase Authentication is the source of coach identity.
- The User model stores the verified Firebase UID and coach profile information.
- Create the database User record on first verified access.
- Provisioning must be idempotent.
- Each User owns their own client and coaching records.
- No role field is required because every registered account is a coach.
- No client User records are created.

---

## 6. Enumerations

The following enums define the allowed application states.

### ClientSex

- MALE
- FEMALE
- OTHER
- PREFER_NOT_TO_SAY

### ExperienceLevel

- BEGINNER
- INTERMEDIATE
- ADVANCED

### ClientStatus

- ACTIVE
- INACTIVE

### ProgramStatus

- DRAFT
- ACTIVE
- ARCHIVED

### AssignmentStatus

- ACTIVE
- COMPLETED
- PAUSED
- CANCELED

### MealPlanStatus

- DRAFT
- ACTIVE
- ARCHIVED

### CheckInStatus

- DRAFT
- COMPLETED

### ScheduleEventType

- CHECK_IN
- COACHING_CALL
- PROGRAM_REVIEW
- NUTRITION_REVIEW
- OTHER

### ScheduleEventStatus

- SCHEDULED
- COMPLETED
- CANCELED

### AdjustmentCategory

- TRAINING
- NUTRITION

---

## 7. Relationship Overview

```text
User (Coach)
 |
 +---- ClientProfile
 |       |
 |       +---- NutritionProfile
 |       +---- ProgramAssignment
 |       +---- MealPlanAssignment
 |       +---- Measurement
 |       |       |
 |       |       +---- CheckIn (optional one-to-one)
 |       |
 |       +---- CheckIn
 |       +---- ScheduleEvent
 |       +---- CoachNote
 |       +---- CoachingAdjustment
 |
 +---- TrainingProgram
 |       |
 |       +---- WorkoutDay
 |       |       |
 |       |       +---- WorkoutExercise
 |       |
 |       +---- ProgramAssignment
 |
 +---- MealPlan
 |       |
 |       +---- Meal
 |       |       |
 |       |       +---- MealFood
 |       |               |
 |       |               +---- FoodItem
 |       |
 |       +---- MealPlanAssignment
 |
 +---- FoodItem
 +---- ScheduleEvent
 +---- AvailabilityRule
 +---- CoachNote
 +---- CoachingAdjustment
```

This is a conceptual relationship overview. The Prisma schema defines the authoritative foreign-key relationships.

---

## 8. Indexes and Uniqueness

The following indexes are expected in the initial schema.

| Model | Index or Constraint |
|---|---|
| User | Unique firebaseUid |
| User | Unique normalized email |
| ClientProfile | coachId + status |
| ClientProfile | coachId + fullName |
| TrainingProgram | coachId + status |
| WorkoutDay | Unique programId + sortOrder |
| WorkoutExercise | Unique workoutDayId + sortOrder |
| ProgramAssignment | clientId + status |
| ProgramAssignment | programId + status |
| ProgramAssignment | One primary active assignment per client |
| NutritionProfile | Unique clientId |
| FoodItem | coachId + isArchived |
| MealPlan | coachId + status |
| Meal | Unique mealPlanId + sortOrder |
| MealFood | Unique mealId + foodItemId |
| MealPlanAssignment | clientId + status |
| MealPlanAssignment | mealPlanId + status |
| MealPlanAssignment | One primary active assignment per client |
| Measurement | clientId + recordedAt |
| CheckIn | clientId + checkInDate |
| CheckIn | Unique measurementId when present |
| ScheduleEvent | coachId + startAt |
| ScheduleEvent | clientId + startAt |
| AvailabilityRule | coachId + weekday |
| CoachNote | coachId + clientId + createdAt |
| CoachingAdjustment | coachId + clientId + effectiveAt |

### 8.1 Email Uniqueness

Application code must normalize coach emails to lowercase before saving.

If case-insensitive uniqueness is required at the database level, use a reviewed PostgreSQL expression index or an appropriate case-insensitive column type.

Do not assume a normal unique index automatically enforces lowercase normalization.

### 8.2 Partial Unique Indexes

The primary assignment rules require PostgreSQL partial unique indexes.

Conceptual SQL:

```sql
CREATE UNIQUE INDEX program_assignment_one_primary_active_per_client
ON program_assignments (client_id)
WHERE is_primary = true AND status = 'ACTIVE';

CREATE UNIQUE INDEX meal_plan_assignment_one_primary_active_per_client
ON meal_plan_assignments (client_id)
WHERE is_primary = true AND status = 'ACTIVE';
```

The exact SQL, identifier quoting, Prisma compatibility, and migration behavior must be tested before approval.

When promoting a new primary assignment, use a transaction to demote the old primary and promote the new one.

---

## 9. Data Integrity Constraints

Validation must exist at the application layer and, where appropriate, at the PostgreSQL layer.

### 9.1 Required Numeric Checks

- Weight must be greater than zero when supplied.
- Height must be greater than zero when supplied.
- Body-fat percentage must be within 0–100.
- Muscle mass cannot be negative.
- Body measurements cannot be negative.
- Calories cannot be negative.
- Protein, carbohydrates, and fats cannot be negative.
- Exercise sets must be greater than zero.
- Exercise repetitions must be positive.
- Exercise maximum repetitions cannot be lower than minimum repetitions.
- Food quantity must be greater than zero.
- Rest duration cannot be negative.

### 9.2 Date Checks

- Assignment end dates cannot precede start dates.
- Schedule event end times must be after start times.
- Availability end minutes must be greater than start minutes.
- Historical measurements must have a valid recorded timestamp.

### 9.3 Measurement Requirements

At least one measurement field must be provided for each Measurement record.

A CheckIn may exist without a Measurement.

A Measurement may exist without a CheckIn.

### 9.4 Cross-Record Validation

The following relationships require server-side verification:

- Program and client belong to the same coach.
- Meal plan and client belong to the same coach.
- Food item and meal plan belong to the same coach.
- Schedule event and associated client belong to the same coach.
- Coach note and client belong to the same coach.
- Coaching adjustment and client belong to the same coach.
- Check-in and linked measurement belong to the same client.

---

## 10. Deletion and Archiving Policy

Historical coaching information must not disappear through accidental deletion.

| Record | Expected Behavior |
|---|---|
| ClientProfile | Deactivate; do not casually hard-delete |
| TrainingProgram | Archive when historically assigned |
| MealPlan | Archive when historically assigned |
| FoodItem | Archive when referenced |
| ProgramAssignment | Preserve history |
| MealPlanAssignment | Preserve history |
| Measurement | Preserve history |
| CheckIn | Preserve history |
| ScheduleEvent | Cancel instead of deleting historical events |
| CoachNote | Preserve history |
| CoachingAdjustment | Preserve history |

### 10.1 Cascade Rules

Cascades may be used for unreferenced child records such as:

- WorkoutDay to WorkoutExercise.
- Meal to MealFood.

However, deleting a parent template must first be prevented when historical assignments or references exist.

Foreign-key behavior must be explicit in the Prisma schema.

---

## 11. Assignment Snapshot Strategy

Reusable templates and assigned content have different responsibilities.

A reusable TrainingProgram or MealPlan may change over time.

An existing assignment must preserve the content that was assigned at that time.

### 11.1 Training Snapshot

ProgramAssignment stores a JSON snapshot containing:

- Snapshot version.
- Program name.
- Program description.
- Goal and experience level.
- Duration.
- Workout days.
- Exercise names.
- Sets and repetitions.
- Rest duration.
- Target weight where applicable.
- Instructions.
- Original ordering.

### 11.2 Nutrition Snapshot

MealPlanAssignment stores a JSON snapshot containing:

- Snapshot version.
- Meal plan name.
- Description and goal.
- Duration.
- Target calories and macros.
- Meals.
- Food names.
- Serving labels.
- Quantities.
- Nutritional values.
- Meal and food ordering.

### 11.3 Snapshot Rules

- Snapshots are generated on assignment.
- Snapshot structure is versioned.
- Snapshot data is validated before storage.
- Editing reusable templates does not automatically update existing snapshots.
- Updating an existing assignment requires an explicit coach action.
- Historical snapshots must remain readable even when the reusable template changes.

---

## 12. Transaction Requirements

The following operations should use database transactions:

1. Assigning a training program.
2. Assigning a meal plan.
3. Promoting a primary assignment.
4. Replacing an existing primary assignment.
5. Creating a check-in with a linked measurement.
6. Updating related records that must remain consistent.
7. Operations that update multiple coaching records together.

Transactions must be scoped and validated before execution.

Do not use transactions unnecessarily for independent single-record operations.

---

## 13. Deferred Database Features

The following are intentionally excluded from the initial database implementation:

- Client user accounts.
- Firebase client identities.
- Client invitations.
- Client portal permissions.
- Client-submitted check-ins.
- Client workout logs.
- Client food logs.
- Progress photo storage metadata.
- Payment records.
- Subscription billing.
- Messaging and chat.
- Notification infrastructure.
- Wearable integrations.
- Sleep tracking.
- AI-generated plans.
- Multi-coach organizations.

Progress photo storage will be designed separately when an approved private storage provider is selected.

---

## 14. Database Environment and Migration Rules

### 14.1 Development Database

Use a dedicated development database.

Database name:

`trainoryx_v2`

Never reuse the Trainoryx V1 database.

### 14.2 Environment Variables

Expected database variables:

```env
DATABASE_URL=
DIRECT_URL=
```

- DATABASE_URL: pooled runtime connection.
- DIRECT_URL: direct database connection for migration tooling.

Actual connection strings must never be committed.

### 14.3 Migration Rules

- Review schema changes before generating migrations.
- Use Prisma migration tooling for version-controlled migrations.
- Review generated SQL for important constraints and indexes.
- Keep custom SQL migrations documented.
- Do not edit an already-applied migration casually.
- Never run development reset commands against production.
- Never run migrations automatically during application startup.

### 14.4 Production Safety

Before production migrations:

1. Review the schema change.
2. Review generated SQL.
3. Confirm the target database.
4. Verify backup/export availability.
5. Apply through a controlled process.
6. Verify the resulting database structure.

---

## 15. Prisma Implementation Requirements

The Prisma implementation must:

- Use the stable Prisma ORM 7 release selected for the project.
- Use `prisma.config.ts` for connection configuration.
- Keep the runtime and migration connection URLs separate.
- Use explicit model relations.
- Use explicit table and column mappings.
- Use UUID primary keys.
- Use appropriate PostgreSQL native types.
- Include the approved enums.
- Include the approved indexes and uniqueness rules.
- Preserve historical assignment snapshots.
- Include reviewed custom SQL where Prisma schema declarations are insufficient.

Prisma schema validation and migration generation must be completed before database deployment.

A generated Prisma Client is not proof that database constraints or business rules are correct.

---

## 16. Database Change Review

Before a future schema migration:

- [ ] All 18 models are reviewed.
- [ ] All model fields and types are reviewed.
- [ ] All relationships are reviewed.
- [ ] All foreign-key deletion rules are reviewed.
- [ ] All indexes and uniqueness rules are reviewed.
- [ ] Partial unique indexes are reviewed.
- [ ] Numeric constraints are reviewed.
- [ ] Date and timezone rules are reviewed.
- [ ] Ownership rules are reviewed.
- [ ] Snapshot formats are reviewed.
- [ ] Prisma schema passes validation.
- [ ] Migration SQL is reviewed.
- [ ] Fresh development database target is confirmed.
- [ ] No V1 database connection is configured.

---

## 17. Current Database Status

| Area | Status |
|---|---|
| Coach-only data model | Approved |
| 18-model baseline | Implemented |
| Assignment behavior | Approved |
| Independent measurements | Approved |
| Historical snapshots | Approved |
| Primary assignment rules | Approved |
| Field definitions | Documented |
| Relationships | Documented |
| Indexes | Implemented and reviewed |
| PostgreSQL constraints | Implemented and reviewed |
| Prisma schema | Implemented |
| Prisma validation | Passed |
| Neon connection | Configured and verified |
| Initial migration | Applied and verified |

---

## 18. Source of Truth

This document defines the intended database contract for Trainoryx.

The actual Prisma schema and applied database migrations define the implemented database structure.

Any difference between this specification and implementation must be reviewed and documented.

Do not silently change model fields, relationships, constraints, or ownership behavior.

**End of Database Specification**
