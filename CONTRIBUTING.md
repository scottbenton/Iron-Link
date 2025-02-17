![Contributing](./readme_assets/banner-contributing.png)

Any development help on this project is more than welcome! New features should be developed in feature branches, and then will be merged into the `main` branch to deploy to production.

## Development Setup

In order to work on this app, you will need to clone this repository and run it locally. See [SETUP.md](./SETUP.md) for instructions on how to get everything running.

## Picking Up Tickets

My todo list for this application can be found [here](https://github.com/users/scottbenton/projects/7/views/3). If you would like to work on something that is not on that list, please open up an issue or reach out on discord so that we can discuss your proposed changes! I don't want you to waste any time on something that might not end up getting merged (for example, anything adding generative AI integration will **not** be merged). If you are new to the project, I would recommend looking for issues that are tagged with `good first issue`. The tickets I've created might not be well fleshed out, so feel free to ask any clarifying questions you have before you begin - either on the ticket, or reach out to me directly on discord!

Discord Username: `scottbenton`

## Important Libraries

- [Zustand](https://zustand.docs.pmnd.rs/getting-started/introduction) - used for storing global state across the application. Used instead of context because we can more easily control when components rerender.
- [Supabase](https://supabase.com/) - A backend-as-a-service. Supabase provides authentication, a database, and image storage for the app, as well as a library to interact with those pieces.
- [Material UI](https://mui.com/material-ui/getting-started/) - The component library that drives the styling in this project.
- [Datasworn](https://github.com/rsek/datasworn) - rsek's incredible work that has digitized the rules of Ironsworn games and allows for easy interactions between them.

## File Structure & Organization

This project has grown a lot further than I originally intended. Because of that, its a lot messier than I intended. However, I try to generally follow this structure in order to keep a little bit of the chaos contained.

### Data Flow

Our data is stored in a postgres instance managed by supabase. This database is built with features that enable real-time sync for applications such as ours, and most of the connections in our app need to reflect this. A transaction with the database to get real time updates occurs in two parts - a one-time call, to get the initial state, and then a websocket connection that continually fetches the latest updates from the database.

In order to organize the flow of data, we keep all of our interactions with supabase in the `repositories` directory. Every function that we write that interacts with the database should go in here. These functions should not be called directly - we want the logic to be kept modular so that we could replace supabase with a different backend in the future if needed. So instead, we have the `services` directory, which mainly functions to connect app logic to the mutations and queries defined in the `repository` files.

From there, we need to organize the data we receive (and the mutations we can call to update it) into states that react can integrate with. In order to do this, we write zustand states in `stores`. From within this slice, we handle organizing, grouping, and exposing actions to the rest of the UI.

Once our data is organized, we can begin to use it on the frontend. We often need to create and call a listener hook (ex: [useListenToNPCs](src/stores/world/currentWorld/npcs/useListenToNPCs.ts)) in order to get the data populated into zustand. From there, we can begin to consume data from the store, and dispatch actions back through the store in order populate our UI and update the database with changes.

#### Creating a new database table

You can create a new table through the supabase UI. Make sure to add the following to the `migration.sql` file that you create if your new table requires realtime publication:

```sql
alter publication supabase_realtime add table replace_this_with_table_name;
```

### File Organization

Try your best to abide by the following "organization", but don't let it worry you! I certainly haven't perfectly followed it either! If I see anything too far off I'll throw up a comment on a pull request!

Folder       | Purpose
------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
assets       | Stores static assets (like icons) that are used across the app
components   | Stores components & hooks that are not specific to one page - generic components are kept under `components/shared`, while components that relate to a specific feature are under `components/features`
data         | Mostly organizes and re-exports data from the datasworn library in a way that works well for our applications
hooks        | Custom react hooks should go here. If the hook deals with logic that is specific to a certain component or a certain part of the application, it might be better suited to be stored with that component. Use your best judgement!
i18n         | Contains translation configuration (and potentially language files in the future)
lib          | Contains shared functions and some configuration needed for third-party libraries
pages        | Each page in our apps has a component here. If that page contains components or hooks that are only needed for that page, those should be contained here as well. If the component is needed across pages, the `components` folder should be used instead.
providers    | A few React context providers. ThemeProvider houses the theme variables for the application
repositories | Lowest level interaction with the storage APIs
services     | Next level up interaction with the storage APIs - connects our application logic in
stores       | Mostly handles connecting React to our services, but also has a few global application states bundled in.
tests        | A few tests havebeen added here
types        | Random shared typescript types for different features & database objects

## Getting Help

I am **always** happy to help troubleshoot issues and guide development that you are working on! Feel free to reach out to me here, or on Discord (username: scottbenton) for help.
