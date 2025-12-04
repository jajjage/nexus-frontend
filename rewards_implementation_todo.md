# Rewards System Backend Implementation Todo List

## 1. Database Models & Schema

- [ ] Create Rewards model with fields: id, userId, points, reason, earnedAt, status
- [ ] Create Referrals model with fields: id, referrerUserId, referredUserId, rewardAmount, status, createdAt
- [ ] Create Badges model with fields: id, name, description, icon, requiredAction, createdAt
- [ ] Create UserBadges junction table: userId, badgeId, earnedAt
- [ ] Update User model to include: totalPoints, cashbackBalance, referralCount, etc.

## 2. Type Definitions (Frontend)

- [ ] Create Rewards type in `/src/types/rewards.types.ts`
  - RewardsSummary: {totalPoints, referralEarnings, completedReferrals, pendingRewards}
  - Badge: {id, name, description, icon}
  - Reward: {id, type, amount, reason, earnedAt, status}
- [ ] Update User type in `/src/types/api.types.ts` to include rewards fields
- [ ] Create referral types with proper interfaces

## 3. Backend Service Layer

- [ ] Create rewards service with methods:
  - getRewardsSummary(userId: string)
  - getUserBadges(userId: string)
  - getReferralStats(userId: string)
  - getReferralList(userId: string)
  - awardPoints(userId: string, amount: number, reason: string)
  - awardBadge(userId: string, badgeId: string)
- [ ] Create referrals service with methods:
  - createReferral(referrerId, referredId)
  - getReferralsForUser(userId)
  - processReferralReward(referralId)

## 4. Frontend Service Layer

- [ ] Create `/src/services/rewards.service.ts`
  - getRewards(): Promise<ApiResponse<RewardsSummary>>
  - getUserBadges(): Promise<ApiResponse<Badge[]>>
  - getReferralStats(): Promise<ApiResponse<ReferralStats>>
  - getReferralList(): Promise<ApiResponse<Referral[]>>
- [ ] Update existing referral service methods

## 5. API Routes (Backend)

- [ ] Create `/api/v1/dashboard/rewards` route with GET method
- [ ] Create `/api/v1/dashboard/rewards/badges` route
- [ ] Create `/api/v1/dashboard/referrals` route with GET and POST methods
- [ ] Create `/api/v1/dashboard/referrals/share` route for referral link generation

## 6. Controller Implementation (Backend)

- [ ] Create RewardsController with methods:
  - getRewardsSummary(req, res)
  - getUserBadges(req, res)
  - getReferrals(req, res)
- [ ] Create ReferralsController with methods:
  - getReferralStats(req, res)
  - createReferral(req, res)
  - getReferralList(req, res)
  - generateReferralLink(req, res)

## 7. Frontend Hook Implementation

- [ ] Create `/src/hooks/useRewards.ts`
  - useRewards(): query hook for rewards summary
  - useUserBadges(): query hook for user badges
  - useReferralStats(): query hook for referral statistics
  - useReferralList(): query hook for referral list
- [ ] Update existing useAuth hook to include rewards data in user object

## 8. Frontend Component Updates

- [ ] Update RewardsPage to use new hooks instead of mock data
- [ ] Update ReferralsPage to use new hooks instead of mock data
- [ ] Modify dashboard components to display real rewards data
- [ ] Update referral card component to use actual data

## 9. Middleware & Authorization

- [ ] Add authentication middleware to rewards endpoints
- [ ] Add authorization checks to ensure users can only access their own data
- [ ] Implement proper error handling and validation

## 10. Testing

- [ ] Write unit tests for rewards service methods
- [ ] Write unit tests for referrals service methods
- [ ] Write integration tests for API endpoints
- [ ] Write frontend tests for new hooks and components

## 11. Documentation & Validation

- [ ] Add input validation to all API endpoints
- [ ] Add Swagger/OpenAPI documentation for new endpoints
- [ ] Update API response schemas
- [ ] Add proper error response handling

## 12. Integration Points

- [ ] Integrate rewards system with transaction processing
- [ ] Add rewards calculation on successful transactions
- [ ] Implement referral tracking on user registration
- [ ] Connect badge system with user actions (first transaction, etc.)

## 13. Performance Optimization

- [ ] Add caching for rewards summary data
- [ ] Implement proper indexing on rewards and referrals tables
- [ ] Add pagination for referral list endpoint
- [ ] Optimize database queries with proper joins

## 14. Security Considerations

- [ ] Implement rate limiting on referral endpoints
- [ ] Add proper validation to prevent reward manipulation
- [ ] Ensure proper data sanitization
- [ ] Add audit logging for reward transactions
