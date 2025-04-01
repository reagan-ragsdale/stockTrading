import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerTradeScreenComponent } from './server-trade-screen.component';

describe('ServerTradeScreenComponent', () => {
  let component: ServerTradeScreenComponent;
  let fixture: ComponentFixture<ServerTradeScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServerTradeScreenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServerTradeScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
