
export class RandomNotes {
  constructor(notes, opts={}) {
    this.notes = notes;
    this.generator = new MersenneTwister();

    const groupsCount = opts.notes || 3
    this.groups = []

    if (groupsCount == 1) {
      this.groups.push(this.notes)
    } else {
      const groupSize = Math.floor(this.notes.length / groupsCount)
      if (groupSize < 1) {
        throw new Error("Invalid notes size for number of notes")
      }

      for (let i = 0; i < groupsCount; i++) {
        if (i == groupsCount - 1) {
          this.groups.push(this.notes.slice(i * groupSize))
        } else {
          this.groups.push(this.notes.slice(i * groupSize, (i + 1) * groupSize))
        }
      }
    }
  }

  nextNote() {
    return this.groups.map(g => g[this.generator.int() % g.length])
  }
}

// for debugging staves
export class SweepRangeNotes {
  constructor(notes) {
    this.notes = notes;
    this.i = 0;
    this.ascending = true;
  }

  nextNote() {
    if (this.i < 0) {
      this.i = 1;
      this.ascending = !this.ascending;
    }

    if (this.i >= this.notes.length) {
      this.i = this.notes.length - 2;
      this.ascending = !this.ascending;
    }

    if (this.ascending) {
      return this.notes[this.i++ % this.notes.length];
    } else {
      return this.notes[this.i-- % this.notes.length];
    }
  }
}

export class MiniSteps {
  constructor(notes) {
    this.notes = notes;
    this.generator = new MersenneTwister();
  }

  nextStep() {
    return {
      position: this.generator.int() % this.notes.length,
      remaining: 2 + this.generator.int() % 2,
      direction: this.generator.int() % 2 == 0 ? 1 : -1,
    };
  }

  nextNote() {
    if (!this.currentStep || this.currentStep.remaining == 0) {
      this.currentStep = this.nextStep();
    }

    let position = this.currentStep.position + this.notes.length;
    this.currentStep.position += this.currentStep.direction;
    this.currentStep.remaining -= 1;

    return this.notes[position % this.notes.length];
  }
}

export class ShapeGenerator {
  constructor() {
    this.generator = new MersenneTwister()
  }

  nextNote() {
    let shape = this.shapes[this.generator.int() % this.shapes.length]
    let shapeMax = Math.max(...shape)

    if (shapeMax > this.notes.length) {
      throw "shape too big for available notes";
    }

    let bass = this.generator.int() % (this.notes.length - shapeMax)

    return shape.map((offset) => this.notes[(bass + offset) % this.notes.length])
  }

  // get the shape and all the inversions for it
  inversions(shape) {
    shape = [...shape]
    shape.sort((a,b) => a - b)

    let out = [shape]
    let count = shape.length - 1

    while (count > 0) {
      let dupe = [...out[out.length - 1]]
      dupe.push(dupe.shift() + 7)
      dupe.sort((a,b) => a - b)

      while (dupe[0] > 0) {
        for (let i in dupe) {
          dupe[i] -= 1
        }
      }
      out.push(dupe)
      count--;
    }

    return out
  }
}

export class TriadNotes extends ShapeGenerator {
  constructor(notes) {
    super()
    this.notes = notes
    this.shapes = this.inversions([0,2,4])
  }
}

export class SevenOpenNotes extends ShapeGenerator {
  constructor(notes) {
    super()
    this.notes = notes;
    // some random inversions spaced apart
    this.shapes = [
      // root on bottom
      [0, 4, 9, 13],
      [0, 6, 9, 11],

      // third on bottom
      [2 - 2, 6 - 2, 11 - 2, 14 - 2],
      [2 - 2, 7 - 2, 11 - 2, 13 - 2],

      // fifth on bottom
      [4 - 4, 6 - 4, 9 - 4, 14 - 4],
      [4 - 4, 7 - 4, 9 - 4, 13 - 4],

    ]
  }
}

export class ProgressionGenerator {
  constructor(scale, range, progression) {
    this.position = 0
    this.progression = progression
    this.generator = new MersenneTwister()

    // calculate all the roots we can use to build chords on top of
    let roots = scale.getLooseRange(...range)
    this.rootsByDegree = {}

    for (let r of roots) {
      let degree = scale.getDegree(r)
      this.rootsByDegree[degree] = this.rootsByDegree[degree] || []
      this.rootsByDegree[degree].push(r)
    }
  }

  nextNote() {
    let [degree, chord] = this.progression[this.position % this.progression.length]
    let availableRoots = this.rootsByDegree[degree]
    this.position += 1

    if (!availableRoots) {
      throw new Error("chord doesn't fit in scale range")
    }

    return Chord.notes(availableRoots[0], chord)
  }
}

