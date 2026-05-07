import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css'],
})
export class LayoutComponent implements OnInit {
  isSidenavOpen = true;
  isStaff = false;
  isAdmin = false;

  private readonly allMenuItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Products', icon: 'inventory_2', route: '/products' },
    { label: 'Suppliers', icon: 'local_shipping', route: '/suppliers' },
    { label: 'Categories', icon: 'category', route: '/categories' },
    { label: 'Sales', icon: 'point_of_sale', route: '/sales' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.isStaff = this.authService.isStaff();
    this.isAdmin = this.authService.isAdmin();
  }

  get menuItems() {
    if (this.isStaff && !this.isAdmin) {
      return this.allMenuItems.filter(
        (item) => item.route === '/dashboard' || item.route === '/sales',
      );
    }
    return this.allMenuItems;
  }

  toggleSidenav(): void {
    this.isSidenavOpen = !this.isSidenavOpen;
  }

  // ⭐ Logout
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
