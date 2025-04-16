import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddGraphComponent } from './add-graph.component';

describe('AddGraphComponent', () => {
  let component: AddGraphComponent;
  let fixture: ComponentFixture<AddGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddGraphComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
