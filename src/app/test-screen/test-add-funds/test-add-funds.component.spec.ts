import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestAddFundsComponent } from './test-add-funds.component';

describe('TestAddFundsComponent', () => {
  let component: TestAddFundsComponent;
  let fixture: ComponentFixture<TestAddFundsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestAddFundsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestAddFundsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
