# ClearSky Marketplace E2E Testing Guide

## Overview

This guide walks you through the complete end-to-end testing flow for the ClearSky Data Marketplace. You'll test the entire buyer journey from registration to purchasing AQI data derivatives as NFTs on Story Protocol.

## Prerequisites

- Server running on `http://localhost:3000`
- MongoDB connected and running
- Story Protocol Aeneid testnet configured
- At least one derivative already processed and available
- Test wallet addresses ready

## E2E Flow

### Phase 1: Buyer Registration

**Objective**: Register a new user as a buyer (with assets field support)

**What Happens**:
1. A new user document is created in MongoDB
2. User has `walletAddress`, `devices[]`, and `assets[]` fields
3. Assets array starts empty

**Expected Outcome**: Buyer registered with empty assets array

---

### Phase 2: Browse Available Derivatives

**Objective**: Fetch all available derivatives and see their metadata, owners, and primitive data

**What Happens**:
1. API returns all derivatives with `is_minted: false`
2. Each derivative includes:
   - Derivative metadata (type, content, processing state)
   - Primitive AQI readings (parent_data_ids)
   - Original data owner information
   - IPFS hash and content hash
   - Processing metadata

**Expected Outcome**: List of available derivatives with complete metadata

---

### Phase 3: Filter and Search Derivatives

**Objective**: Search for specific derivatives using filters

**What Happens**:
1. Filter by derivative type (DAILY/MONTHLY)
2. Filter by minted status
3. Pagination support (limit, offset)

**Expected Outcome**: Filtered list matching search criteria

---

### Phase 4: Get Derivative Details

**Objective**: View detailed information about a specific derivative

**What Happens**:
1. Fetch single derivative by ID
2. View all primitive AQI readings
3. See complete processing pipeline metadata
4. View IPFS URIs and content hashes

**Expected Outcome**: Complete derivative details with primitive data

---

### Phase 5: Purchase Single Derivative

**Objective**: Buy a single derivative and mint it as an NFT

**What Happens** (with extensive logging):

#### Step 1: Request Validation
- ✅ Validate buyer wallet address format
- ✅ Check derivative exists
- ✅ Verify derivative not already minted
- 📝 **Log**: Request details, wallet validation, derivative lookup

#### Step 2: Identify Original Owner
- ✅ Fetch primitive AQI readings
- ✅ Extract original device owner from readings
- 📝 **Log**: Primitive readings, original owner wallet

#### Step 3: Calculate Pricing
- ✅ Base price: $100
- ✅ Platform fee: 10% ($10)
- ✅ Original owner royalty: 5% ($5)
- ✅ Seller receives: $85
- 📝 **Log**: Complete pricing breakdown

#### Step 4: Register IP Asset & Mint NFT
- ✅ Call Story Protocol SDK `ipAsset.register()`
- ✅ Generate unique token ID
- ✅ Register IP metadata with IPFS hash
- ✅ Receive IP ID and transaction hash
- 📝 **Log**: IP registration request, response with ipId, tokenId, txHash

#### Step 5: Transfer NFT to Buyer
- ✅ Transfer NFT from platform wallet to buyer wallet
- ✅ Use ERC721 `transferFrom()`
- ✅ Get transfer transaction hash
- 📝 **Log**: Transfer parameters, transaction hash

#### Step 6: Update Derivative Record
- ✅ Set `ip_id`, `token_id`, `is_minted: true`
- ✅ Save to MongoDB
- 📝 **Log**: Updated derivative document

#### Step 7: Create Asset Record
- ✅ Generate unique `asset_id`
- ✅ Link to derivative, primitive data, and IP
- ✅ Record pricing and royalty info
- ✅ Store metadata (type, hashes, IPFS URI)
- 📝 **Log**: Complete asset document

#### Step 8: Update Buyer User Record
- ✅ Find or create buyer user document
- ✅ Add asset_id to assets array
- ✅ Save to MongoDB
- 📝 **Log**: User document before/after update

#### Step 9: Update Original Owner Record
- ✅ Look up original owner in users collection
- ✅ Log royalty distribution
- 📝 **Log**: Original owner lookup, royalty amount

**Expected Outcome**:
- NFT minted and transferred to buyer
- Asset record created in MongoDB
- Buyer's user record updated with new asset
- Royalty and platform fee tracked
- All steps logged with detailed debug info

---

### Phase 6: Bulk Purchase Derivatives

**Objective**: Purchase multiple derivatives at once

**What Happens**:

#### Option A: Purchase by IDs
- Provide array of derivative IDs
- Process each derivative sequentially
- Track success/failure for each

#### Option B: Purchase by Filter
- Define filter criteria (type, limit)
- Find matching unminted derivatives
- Process batch purchase

**For Each Derivative**:
1. Mint IP Asset
2. Transfer to buyer
3. Create asset record
4. Update derivative
5. Log all steps

**Final Step**:
- Update buyer's assets array with all successful purchases
- 📝 **Log**: Bulk purchase summary, success/failure counts

**Expected Outcome**: Multiple NFTs purchased, all tracked in assets

---

### Phase 7: Verify Asset Ownership

**Objective**: Confirm buyer owns the purchased assets

**What Happens**:
1. Query assets collection by buyer wallet
2. Retrieve all asset records
3. Each asset includes:
   - Derivative reference
   - Primitive data IDs
   - IP ID and Token ID
   - Purchase price and royalties
   - Metadata

**Expected Outcome**: All purchased assets returned with complete details

---

### Phase 8: Verify MongoDB State

**Objective**: Manually verify database integrity

**What to Check**:

#### Users Collection
```json
{
  "walletAddress": "0x...",
  "devices": [],
  "assets": ["asset_xxx", "asset_yyy"]
}
```

#### Assets Collection
```json
{
  "asset_id": "asset_xxx",
  "owner_wallet": "0x...",
  "derivative_id": "deriv_xxx",
  "primitive_data_ids": ["reading_1", "reading_2"],
  "ip_id": "0x...",
  "token_id": "123456",
  "purchase_price": 100,
  "royalty_paid_to_original_owner": 5,
  "platform_fee": 10,
  "metadata": {
    "derivative_type": "MONTHLY",
    "content_hash": "0x...",
    "ipfs_uri": "ipfs://..."
  }
}
```

#### Derivatives Collection
```json
{
  "derivative_id": "deriv_xxx",
  "is_minted": true,
  "ip_id": "0x...",
  "token_id": "123456",
  "parent_data_ids": ["reading_1", "reading_2"]
}
```

**Expected Outcome**: All collections properly updated and linked

---

### Phase 9: Download Purchased Derivative

**Objective**: Verify buyer can access their purchased data

**What Happens**:
1. Buyer requests download with derivative ID
2. System verifies ownership via Story Protocol
3. Calls ERC721 `ownerOf(tokenId)`
4. Compares owner with requester
5. If match, grants access to derivative content
6. 📝 **Log**: Ownership verification steps, result

**Expected Outcome**: Buyer can download, non-owners denied

---

## Log Inspection Points

When running tests, monitor logs for these key events:

### 1. Purchase Initiation
```
[MARKETPLACE:PURCHASE] Purchase initiated
  derivative_id: deriv_xxx
  buyer_wallet: 0x...
```

### 2. Pricing Calculation
```
[MARKETPLACE:PURCHASE] Pricing calculated
  base_price: 100
  platform_fee: 10
  royalty: 5
  original_owner_receives: 5
```

### 3. IP Asset Registration
```
[MARKETPLACE:PURCHASE] IP Asset registered and minted
  ip_id: 0x...
  token_id: 123456
  tx_hash: 0x...
```

### 4. NFT Transfer
```
[MARKETPLACE:PURCHASE] NFT transferred to buyer
  token_id: 123456
  buyer_wallet: 0x...
  transfer_tx_hash: 0x...
```

### 5. Asset Creation
```
[MARKETPLACE:PURCHASE] Asset record created
  asset_id: asset_xxx
  asset_data: {...}
```

### 6. User Update
```
[MARKETPLACE:PURCHASE] Buyer user record updated
  buyer_wallet: 0x...
  updated_user: {...}
```

---

## Success Criteria

✅ **User Registration**: Buyer created with assets field
✅ **Browse**: All derivatives listed with metadata
✅ **Filter**: Search returns accurate results
✅ **Details**: Complete derivative info accessible
✅ **Purchase**: NFT minted and transferred successfully
✅ **Asset Tracking**: Asset record created in MongoDB
✅ **User Update**: Buyer's assets array updated
✅ **Royalty Calculation**: Correct distribution logged
✅ **Platform Fee**: Platform cut properly tracked
✅ **IP Ownership**: Buyer owns the IP asset
✅ **MongoDB Integrity**: All collections properly linked
✅ **Ownership Verification**: Download restricted to owner
✅ **Bulk Purchase**: Multiple derivatives processed
✅ **Logging**: All steps logged with debug details

---

## Troubleshooting

### Issue: "Derivative already minted"
**Cause**: Trying to purchase already sold derivative
**Solution**: Filter by `is_minted: false`

### Issue: "Invalid wallet address"
**Cause**: Wrong format
**Solution**: Use valid Ethereum address (0x + 40 hex chars)

### Issue: "Ownership verification failed"
**Cause**: On-chain state not updated yet
**Solution**: Wait for transaction confirmation

### Issue: Missing debug logs
**Cause**: Logger not configured for debug level
**Solution**: Set `LOG_LEVEL=debug` in .env

---

## Next Steps

After completing E2E testing:

1. Review all debug logs for completeness
2. Verify Story Protocol explorer shows transactions
3. Check MongoDB collections for data integrity
4. Test edge cases (duplicate purchases, invalid wallets)
5. Performance test with bulk purchases
6. Implement frontend marketplace UI

---

## API Reference

See companion file: `scripts/test-marketplace-e2e.sh` for actual API calls
