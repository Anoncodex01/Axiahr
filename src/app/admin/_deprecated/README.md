# Deprecated Admin Pages

This folder contains admin pages that are no longer in use and have been replaced by newer implementations.

## Moved Pages

### `/admin/offers-invoices`
- **Status**: Deprecated
- **Reason**: Replaced by `/admin/billing-management` which provides comprehensive invoice and payment management
- **Replacement**: Use `/admin/billing-management` instead
- **Date Moved**: 2024

## Potentially Deprecated Pages

### `/admin/offers`
- **Status**: Under Review
- **Note**: This page appears to use mock data and may be replaced by `/admin/billing-management` or `/admin/employer-tracking`
- **Current Status**: Still exists but dashboard links have been updated to use `/admin/billing-management`

## Updated Dashboard Links

The following dashboard links have been updated:
- `/admin/invoices` → `/admin/billing-management`
- `/admin/payments` → `/admin/payment-tracking`
- `/admin/offers` → `/admin/billing-management` (in "Offers & Payments" section)

## Notes

- These pages are kept for reference but should not be used in production
- All links and references have been updated to point to the new pages
- If you need to restore any of these pages, check the git history

