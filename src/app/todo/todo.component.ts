import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { remult } from 'remult';
import { Task } from '../../shared/tasks/Task';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-todo',
  imports: [CommonModule, FormsModule],
  templateUrl: './todo.component.html',
  styleUrl: './todo.component.css'
})
export class TodoComponent {
  taskRepo = remult.repo(Task);
  tasks: Task[] = [];

  newTaskTitle = ""
  async addTask() {
    try {
      const newTask = await this.taskRepo.insert({ title: this.newTaskTitle })
      this.tasks.push(newTask)
      this.newTaskTitle = ""
    } catch (error: any) {
      alert(error.message)
    }
  }
  async saveTask(task: Task) {
    try {
      await this.taskRepo.save(task)
    } catch (error: any) {
      alert(error.message)
    }
  }

  ngOnInit() {
    this.taskRepo.find().then((items) => (this.tasks = items));
  }
}
