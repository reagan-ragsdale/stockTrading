import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradeHistoryDetailComponent } from './trade-history-detail.component';

describe('TradeHistoryDetailComponent', () => {
  let component: TradeHistoryDetailComponent;
  let fixture: ComponentFixture<TradeHistoryDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TradeHistoryDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TradeHistoryDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
