import { Component } from '@angular/core';

@Component({
  selector: 'app-arrow-spinner',
  templateUrl: './arrow-spinner.component.html',
  styleUrls: ['./arrow-spinner.component.scss']
})
export class ArrowSpinnerComponent {
  rotationDegrees: number = 0;
  newName: string = '';
  names: string[] = [];
  previousIndex: number | null = null;
  previousResponder: number | null = null;
  selectedQuestion: string = '';
  selectedAsker: string = '';
  selectedResponder: string = '';

  questions: string[] = [
    "What is your favorite hobby?",
    "What's the most interesting place you've visited?",
    "What is your dream job?",
    "Who is your role model?",
    "What is your favorite movie?",
    "What is the weirdest food you've ever eaten?",
    "If you could live anywhere in the world, where would it be?",
    "What's one thing you couldn't live without?",
    "What's your favorite book?",
    "What's one thing you're afraid of?"
  ];

  deleteName(index: number) {
    this.names.splice(index, 1);
  }

  getDegreePosition(index: number, name: string) {
    const totalNames = this.names.length;
    const anglePerName = 360 / totalNames;
    const degree = anglePerName * index;

    // Base radius for short names
    let radius = 300;
    const center = 250;

    // Dynamically calculate name width
    const textWidth = this.getTextWidth(name, '18px Arial'); // Calculate the width of the name in pixels

    // Adjust radius based on the name length
    if (textWidth > 100) { // Arbitrary threshold; adjust based on your needs
      radius += (textWidth - 100) / 2; // Move the name further out if it's longer
    }

    // Calculate position using the new radius
    const radian = (degree * Math.PI) / 180;
    const x = Math.cos(radian) * radius + center;
    const y = Math.sin(radian) * radius + center;

    return {
      left: `${x}px`,
      top: `${y}px`,
    };
  }

  getTextWidth(text: string, font: string): number {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      context.font = font; // Set the desired font (same as in your CSS)
      return context.measureText(text).width; // Get the width of the text in pixels
    }
    return 0;
  }

  isLongName(name: string): boolean {
    return name.length > 10;
  }

  addName() {
    if (this.newName) {
      this.names.push(this.newName);
      this.newName = '';
    }
  }

  spin() {
    if (this.names.length > 1) {
      let randomIndexAsker: number;
      let randomIndexResponder: number;

      do {
        randomIndexAsker = Math.floor(Math.random() * this.names.length);
      } while (this.previousIndex === randomIndexAsker);

      this.previousIndex = randomIndexAsker;

      const degreesPerName = 360 / this.names.length;
      const targetRotation = degreesPerName * randomIndexAsker;

      const totalRotationDegrees = (3 * 360) + targetRotation;

      const startRotation = this.rotationDegrees;

      const spinDuration = 4000;
      const start = performance.now();

      const animateSpin = (currentTime: number) => {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / spinDuration, 1);

        const easedProgress = this.easeOutCubic(progress);

        this.rotationDegrees = startRotation + (totalRotationDegrees * easedProgress);

        if (progress < 1) {
          requestAnimationFrame(animateSpin);
        } else {
          this.selectedAsker = this.names[randomIndexAsker];

          do {
            randomIndexResponder = Math.floor(Math.random() * this.names.length);
          } while (
            randomIndexResponder === randomIndexAsker ||
            randomIndexResponder === this.previousResponder
          );

          this.selectedResponder = this.names[randomIndexResponder];
          this.previousResponder = randomIndexResponder;

          this.selectedQuestion = this.questions[Math.floor(Math.random() * this.questions.length)];
        }
      };

      requestAnimationFrame(animateSpin);
    }
  }

  easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }


}
