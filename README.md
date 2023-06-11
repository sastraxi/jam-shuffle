# Jam shuffle

## Getting started: development

1. `yarn`
2. `yarn dlx @yarnpkg/sdks vscode`
3. `yarn dev` (will try to install certificates and ask for root password)

## Next steps

### How should the playlist prompt work?

We can create a categories selector `(state => [{ prompt: "playlist", id: "..." }, ...])`
and then wrap it to create `const useCategories = () => useStore(selectCategories)`.
The state is actually stored as part of the user preferences but we derive it whenever
we want to query what categories exist (e.g. when we want to re-roll).

This selector will be pretty "custom" code that generates the right PromptIdentifiers.

### Where should the re-roll code live?

At the app level all we can do is decide on a new prompt identifier, but when that component
is first rendered it won't have any choice data. This fits with the react idea of it living
in the component state. But we want a global undo, so we need to be able to store the choices
globally otherwise it will be blind to changes of choices within the prompt. 

We'll do that in the history object, with a max of 1.

When we go back to that last overall config we need to be able to "set" the choices, too.
So that points towards global config that is re-initialized exactly once every time the prompt
first comes up (not when it just gets different params). I think that probably works well with
a `useEffect(() => ..., [])` as if the back button puts us on the same prompt, the component
doesn't have a reason to dismount/re-mount.

So all re-rolls to mutate this global choices state will actually happen within the component
that represents the prompt. We'll also have to be careful to look at all other props (like
playlist id) that live in the `PromptIdentifier`, so the component will e.g. need to know to
re-roll if the playlist ID changes. I guess that just points to it being inside the deps array
of the `useEffect`.

### Use keen slider

For the pop-up selectors for choices / categories, look at the "timepicker with loop" example.

https://keen-slider.io/examples
