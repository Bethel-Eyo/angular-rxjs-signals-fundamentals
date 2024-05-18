import { Component, computed, inject, Input } from '@angular/core';

import { AsyncPipe, CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { catchError, EMPTY } from 'rxjs';
import { Product } from '../product';
import { ProductService } from '../product.service';
import { CartService } from 'src/app/cart/cart.service';

@Component({
  selector: 'pm-product-detail',
  templateUrl: './product-detail.component.html',
  standalone: true,
  imports: [AsyncPipe, NgIf, NgFor, CurrencyPipe],
})
export class ProductDetailComponent {
  @Input() productId: number = 0;

  private productService = inject(ProductService);
  private cartService = inject(CartService);

  // Product to display
  product = this.productService.product;
  errorMessage = this.productService.productError;

  // Set the page title
  pageTitle = computed(() =>
    this.product()
      ? `Product Detail for: ${this.product()?.productName}`
      : 'Product Detail'
  );

  addToCart(product: Product) {
    this.cartService.addToCart(product);
  }
}
