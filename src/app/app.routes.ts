import {Routes} from '@angular/router';
import { authGuard } from './services/auth.guard';
import { adminGuard } from './services/admin.guard';
import { supplierGuard } from './services/supplier.guard';
import { roleGuard } from './services/role.guard';

export const routes: Routes = [
  // Store Routes
  {
    path: '',
    children: [
      {
        path: '',
        loadComponent: () => import('./views/store/storefront').then(m => m.StorefrontComponent)
      },
      {
        path: 'products/:id',
        loadComponent: () => import('./views/products/product-detail').then(m => m.ProductDetailComponent)
      },
      {
        path: 'review/:orderId/:productId',
        loadComponent: () => import('./views/reviews/review').then(m => m.ReviewComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./views/profile/profile').then(m => m.ProfileComponent),
        canActivate: [authGuard]
      },
      {
        path: 'checkout',
        loadComponent: () => import('./views/checkout/checkout').then(m => m.CheckoutComponent),
        canActivate: [authGuard]
      },
      {
        path: 'orders',
        loadComponent: () => import('./views/orders/orders').then(m => m.OrdersComponent),
        canActivate: [authGuard]
      },
      {
        path: 'notifications',
        loadComponent: () => import('./views/notifications/notifications').then(m => m.NotificationsComponent),
        canActivate: [authGuard]
      },
      {
        path: 'services',
        loadComponent: () => import('./views/services/services').then(m => m.ServicesComponent)
      },
      {
        path: 'after-sales',
        loadComponent: () => import('./views/after-sales/sav-garanties').then(m => m.SavGarantiesComponent)
      },
      {
        path: 'policy/returns',
        loadComponent: () => import('./views/policy/returns').then(m => m.ReturnsPolicyComponent)
      },
      {
        path: 'policy/shipping',
        loadComponent: () => import('./views/policy/shipping').then(m => m.ShippingInfoComponent)
      },
      {
        path: 'financing',
        loadComponent: () => import('./views/financing/financing').then(m => m.FinancingComponent)
      },
      {
        path: 'cuisine',
        loadComponent: () => import('./views/store/storefront').then(m => m.StorefrontComponent),
        data: { category: 'cuisine' }
      },
      {
        path: 'salon',
        loadComponent: () => import('./views/store/storefront').then(m => m.StorefrontComponent),
        data: { category: 'salon' }
      },
      {
        path: 'linge',
        loadComponent: () => import('./views/store/storefront').then(m => m.StorefrontComponent),
        data: { category: 'linge' }
      }
    ]
  },
  // Admin ERP Routes
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin-layout').then(m => m.AdminLayoutComponent),
    canActivate: [adminGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./views/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./views/admin/analytics').then(m => m.AdminAnalytics),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'manager_erp'] }
      },
      {
        path: 'orders',
        loadComponent: () => import('./views/admin/orders').then(m => m.AdminOrders)
      },
      {
        path: 'dispatch',
        loadComponent: () => import('./views/admin/dispatch').then(m => m.AdminDispatch)
      },
      {
        path: 'zones',
        loadComponent: () => import('./views/admin/zones').then(m => m.AdminZones)
      },
      {
        path: 'suppliers',
        loadComponent: () => import('./views/admin/suppliers').then(m => m.AdminSuppliers)
      },
      {
        path: 'customers',
        loadComponent: () => import('./views/admin/customers').then(m => m.AdminCustomers)
      },
      {
        path: 'products',
        loadComponent: () => import('./views/admin/products').then(m => m.AdminProducts)
      },
      {
        path: 'inventory',
        loadComponent: () => import('./views/inventory/inventory').then(m => m.InventoryComponent)
      },
      {
        path: 'promo',
        loadComponent: () => import('./views/admin/promo').then(m => m.AdminPromo)
      },
      {
        path: 'marketing',
        loadComponent: () => import('./views/admin/marketing').then(m => m.AdminMarketing)
      },
      {
        path: 'billing',
        loadComponent: () => import('./views/admin/billing').then(m => m.AdminBilling)
      },
      {
        path: 'reports',
        loadComponent: () => import('./views/admin/reports').then(m => m.AdminReports)
      },
      {
        path: 'support',
        loadComponent: () => import('./views/admin/support').then(m => m.AdminSupport)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./views/admin/notifications_admin').then(m => m.AdminNotifications)
      },
      {
        path: 'users',
        loadComponent: () => import('./views/admin/users').then(m => m.AdminUsers)
      },
      {
        path: 'settings',
        loadComponent: () => import('./views/admin/settings').then(m => m.AdminSettings)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Supplier Routes
  {
    path: 'supplier',
    loadComponent: () => import('./layouts/supplier-layout').then(m => m.SupplierLayoutComponent),
    canActivate: [supplierGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./views/supplier/dashboard').then(m => m.SupplierDashboard)
      },
      {
        path: 'inventory',
        loadComponent: () => import('./views/supplier/inventory').then(m => m.SupplierInventory)
      },
      {
        path: 'orders',
        loadComponent: () => import('./views/supplier/orders').then(m => m.SupplierOrders)
      },
      {
        path: 'products',
        loadComponent: () => import('./views/supplier/products').then(m => m.SupplierProducts)
      },
      {
        path: 'tracking',
        loadComponent: () => import('./views/supplier/tracking').then(m => m.SupplierTracking)
      },
      {
        path: 'settings',
        loadComponent: () => import('./views/supplier/settings').then(m => m.SupplierSettings)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./views/supplier/notifications').then(m => m.SupplierNotifications)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  // Auth Routes
  {
    path: 'auth/login',
    loadComponent: () => import('./views/auth/login').then(m => m.LoginComponent)
  },
  {
    path: 'auth/signup',
    loadComponent: () => import('./views/auth/signup').then(m => m.SignupComponent)
  }
];
