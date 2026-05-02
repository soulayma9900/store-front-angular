import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Layout
import { LayoutComponent } from './layout/layout.component';

// Pages

import { LoginComponent } from './auth/login/login.component';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProductsComponent } from './pages/products/products.component';
import { SuppliersComponent } from './pages/suppliers/suppliers.component';
import { CategoriesComponent } from './pages/categories/categories.component';
import { SalesComponent } from './pages/sales/sales.component';

// Guard
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  // ─── PUBLIC route (no guard) ──────────────────────────
  {
    path: 'login',
    component: LoginComponent,
  },

  // ─── PROTECTED routes (AuthGuard required) ────────────
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard], // 🔒 whole layout is protected
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'products', component: ProductsComponent },
      { path: 'suppliers', component: SuppliersComponent },
      { path: 'categories', component: CategoriesComponent },
      { path: 'sales', component: SalesComponent },
    ],
  },

  // ─── Fallback ──────────────────────────────────────────
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
