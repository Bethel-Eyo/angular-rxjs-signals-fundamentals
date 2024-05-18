import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import { Product, Result } from './product';
import { HttpErrorService } from '../utilities/http-error.service';
import { ReviewService } from '../reviews/review.service';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private productsUrl = 'api/products';

  private http = inject(HttpClient);
  private errorService = inject(HttpErrorService);
  private reviewService = inject(ReviewService);

  selectedProductId = signal<number | undefined>(undefined);

  private productsResult$ = this.http.get<Product[]>(this.productsUrl).pipe(
    map((p) => ({ data: p } as Result<Product[]>)),
    tap(() => console.log('in http product-service pipeline')),
    shareReplay(1), // shareReplay(1) caches the response and replays it for any late subscribers
    catchError((error) =>
      of({
        data: [],
        error: this.errorService.formatError(error),
      } as Result<Product[]>)
    )
  );

  private productsResult = toSignal(this.productsResult$, {
    initialValue: { data: [] } as Result<Product[]>,
  });
  products = computed(() => this.productsResult().data);
  productsError = computed(() => this.productsResult().error);

  private productResult$ = toObservable(this.selectedProductId).pipe(
    filter(Boolean), // ensures that the productSelected$ is not undefined
    switchMap((id) => {
      const url = `${this.productsUrl}/${id}`;
      return this.http.get<Product>(url).pipe(
        switchMap((product) => this.getProductWithReviews(product)),
        catchError((error) =>
          of({
            data: undefined,
            error: this.errorService.formatError(error),
          } as Result<Product[]>)
        )
      );
    }),
    map((product) => ({ data: product } as Result<Product>))
  );

  private productResult = toSignal(this.productResult$);
  product = computed(() => this.productResult()?.data);
  productError = computed(() => this.productResult()?.error);

  // product$ = combineLatest([this.products$, this.productSelected$]).pipe(
  //   map(([products, selectedProductId]) =>
  //     products.find((product) => product.id === selectedProductId)
  //   ),
  //   filter(Boolean),
  //   switchMap((product) => this.getProductWithReviews(product)),
  //   catchError((error) => this.handleError(error))
  // );

  productSelected(selectedProductId: number): void {
    this.selectedProductId.set(selectedProductId);
  }

  private getProductWithReviews(product: Product): Observable<Product> {
    if (product.hasReviews) {
      const url = this.reviewService.getReviewUrl(product.id);
      return this.http.get(url).pipe(
        map((reviews) => ({ ...product, reviews } as Product)),
        catchError((error) => this.handleError(error))
      );
    } else {
      return of(product);
    }
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    const errorMessage = this.errorService.formatError(err);
    return throwError(() => errorMessage);
    // throw errorMessage;
  }
}
