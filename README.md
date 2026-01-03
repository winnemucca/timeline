# TimeGrid

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.4.

## Development server

To start a local development server, run:

```bash
ng serve
```

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## steps & process

### zoom logic

- switching between days, week, month was biggest challenge.
- I recompute a centered date range around today, regenerate the time units for that range, and re-position all work orders using the same unit-based math. Because everything is derived from the same scale configuration, zooming never breaks alignment (took me the longest)
- Due to timing constraints I initally hard coded most styles and worked on z-index. Ideally I would have gone back and planned with in a simpler manner the z-index was a challenge that I will look to refactor

### Service logic

- I seeded the services. initially i called a function in the constructor and initiated them. I found moving to a signal easier to maintain as that simplified updating the values through **update** and **computed**
- I wanted my service delegating which is why it handles the overlap. it makes it easier to track and manage

### CSS

- unfortunately, the sketch pages no longer rendered the view when I came back to clean things up. This limited my ability to follow pixel requirements.
- I did rely on ai tooling to speed up the css work since I no longer had a mock up and was out of time. Ideally I would follow the 7-1 folder structure and have global overrides for components, variables that would set the theme and so on. I do have the variables from the link as the components are still visible. I added what I could. felt like stying in the dark so I was hesitant to override styling
- IN LANDSCAPE view the app is functional. I would recommend that approach as I did not have a plan for portrait stying. this would be an interesting challenge to consider if I have another day

### Testing

- I added some basic test coverage for unit tests
- Angular 21 uses vitest out of box. I have some experience with it, but it does still take some prep work to get tests running
- I wanted to enter into automated tests. I was looking at Cypress since I have used that at my last position but will consider playwright if I make a follow up branch and use as a learning tool
