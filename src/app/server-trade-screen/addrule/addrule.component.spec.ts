import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddruleComponent } from './addrule.component';

describe('AddruleComponent', () => {
  let component: AddruleComponent;
  let fixture: ComponentFixture<AddruleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddruleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddruleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
