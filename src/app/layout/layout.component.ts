import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {

  isSidenavOpen = true;

  menuItems = [
    { label: 'Dashboard',  icon: 'dashboard',     route: '/dashboard'  },
    { label: 'Products',   icon: 'inventory_2',   route: '/products'   },
    { label: 'Categories', icon: 'category',      route: '/categories' },
    { label: 'Sales',      icon: 'point_of_sale', route: '/sales'      }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleSidenav(): void {
    this.isSidenavOpen = !this.isSidenavOpen;
  }

  // ⭐ Logout
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}