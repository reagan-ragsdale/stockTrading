import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRuleComponent } from './addrule.component';

describe('AddruleComponent', () => {
  let component: AddRuleComponent;
  let fixture: ComponentFixture<AddRuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddRuleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
