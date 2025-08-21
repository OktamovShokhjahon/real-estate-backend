# Search Functionality Setup Guide

## Overview

The search functionality allows users to search for reviews about:

- Properties (квартиры)
- Residential complexes (ЖК)
- Landlords (арендодатели)
- Tenants (арендаторы)

All searchable by address (city, street, building).

## Backend Setup

### 1. Start the Backend Server

```bash
cd backend
npm start
```

The server will run on `http://localhost:4100`

### 2. Create Sample Data

Run the sample data creation script to populate the database with test reviews:

```bash
cd backend
node create-sample-data.js
```

This will create:

- A test user account
- 6 sample reviews across different categories
- Reviews for testing search functionality

### 3. Verify Database Connection

Make sure MongoDB is running and accessible at `mongodb://127.0.0.1/prokvartirukz`

## API Endpoints

### Main Search Endpoint

**GET** `/api/property/mixed-reviews`

**Query Parameters:**

- `city` (required): City name (e.g., "Алматы")
- `street` (optional): Street name (e.g., "ул. Абая")
- `building` (optional): Building number (e.g., "15")
- `limit` (optional): Number of results per page (default: 10)
- `page` (optional): Page number for pagination (default: 1)

**Response Format:**

```json
{
  "propertyReviews": [...],
  "residentialComplexReviews": [...],
  "landlordReviews": [...],
  "tenantReviews": [...],
  "propertyTotal": 1,
  "residentialComplexTotal": 1,
  "landlordTotal": 1,
  "tenantTotal": 1
}
```

### Test Endpoint

**GET** `/api/property/search-test`

Use this to verify the search functionality is working:

```bash
curl "http://localhost:4100/api/property/search-test?city=Алматы&street=ул.Абая&building=15"
```

## Frontend Setup

### 1. Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:3000`

### 2. Navigate to Search Page

Go to `http://localhost:3000/search`

## Testing the Search

### Test Cases

1. **City Search Only**

   - Enter: "Алматы"
   - Expected: All reviews in Алматы

2. **City + Street Search**

   - Enter: "Алматы", "ул. Абая"
   - Expected: Reviews on ул. Абая in Алматы

3. **Full Address Search**

   - Enter: "Алматы", "ул. Абая", "15"
   - Expected: Reviews for building 15 on ул. Абая in Алматы

4. **Partial Street Search**
   - Enter: "Алматы", "Абая"
   - Expected: Reviews on any street containing "Абая" in Алматы

### Expected Results

Based on the sample data, searching for "Алматы", "ул. Абая", "15" should return:

- 1 property review (квартира)
- 1 residential complex review (ЖК)
- 1 landlord review (арендодатель)
- 1 tenant review (арендатор)

## Troubleshooting

### Common Issues

1. **"Cannot connect to server" error**

   - Ensure backend is running on port 4100
   - Check MongoDB connection

2. **"No reviews found" error**

   - Run the sample data creation script
   - Check if reviews are approved (`isApproved: true`)

3. **Empty results**
   - Verify search parameters match the data
   - Check browser console for API errors

### Debug Steps

1. **Check Backend Logs**

   ```bash
   cd backend
   npm start
   # Look for MongoDB connection and API request logs
   ```

2. **Test API Directly**

   ```bash
   curl "http://localhost:4100/api/property/mixed-reviews?city=Алматы"
   ```

3. **Check Frontend Console**

   - Open browser dev tools
   - Look for API request/response logs
   - Check for JavaScript errors

4. **Verify Database Content**
   ```bash
   cd backend
   node test-search.js
   ```

## Sample Data Structure

The sample data includes reviews with these characteristics:

- **Property Reviews**: Include details like rooms, floor, area, price
- **Residential Complex Reviews**: Focus on infrastructure and amenities
- **Landlord Reviews**: Include landlord contact information
- **Tenant Reviews**: Include tenant behavior and reliability

## API Response Structure

Each review contains:

- Basic info (title, content, rating, author)
- Address details (city, street, building)
- Review-specific fields based on type
- Timestamps and approval status
- Comments and author information

## Performance Considerations

- Search uses case-insensitive regex matching
- Results are limited to approved reviews only
- Pagination is implemented for large result sets
- Database indexes should be added for production use

## Next Steps

1. Test all search combinations
2. Verify tabbed results display correctly
3. Test error handling and edge cases
4. Add more sample data for comprehensive testing
5. Implement search result caching if needed
