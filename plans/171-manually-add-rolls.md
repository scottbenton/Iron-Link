<requirements>
    <summary>
        Users should be able to manually add rolls to the game log, specifying all details about the roll so that they can roll physical dice and have the result recorded in the app.
    </summary>
    <details>
        - Allow users to open a "Add Roll" dialog from the game log interface.
        - Manually added rolls should have a property indicating they were manually added (e.g. `isManual: true`).
        - In the dialog, provide fields for the different fields for the different roll types in gameLog.service.ts. For example, Stat Rolls should have the following fields:
            - Optional associated move, pulled from the list of active datasworn moves
            - d6 Number
            - modifier
            - adds
            - challenge die 1
            - challenge die 2
            - result
            - statKey
        Fields that are usually calculated (like the result for oracle rolls, or the actionTotal & result for stat rolls) should be calculated instead of being manually entered.

        - Validate inputs to ensure required fields are filled and formatted correctly.
        - For select type fields with a lot of options (like moveId, oracleId), use an autocomplete from MUI. For fields with fewer options (like statKey), use a standard select dropdown.
        - On submission, create a new roll entry in the game log with the provided details.
        - Display the new roll in the game log with all specified information.
        - Ensure the new roll is associated with the correct character and game session.
        - Optionally, allow users to edit or delete manually added rolls after creation.
    </details>
</requirements>
<context>
    ./src/services/gameLog.service.ts - has definitions for different types of dice rolls
    ./src/pages/games/characterSheet/components/GameLog/GameLog.tsx - main game log component, where the "Add Roll" button and dialog will be integrated
    ./src/stores/dataswornTree.store.ts - store containing the list of active datasworn moves, needed for the moveId field in the dialog
    ./src/stores/gameLog.store.ts - store managing the game log entries, where the logs are currently added
    ./src/components/characters/rolls/common - folder with reusable components for displaying roll details, which can be used to display a tag for manually added rolls
</context>
<steps>
    <step id="1" type="research" name="inintial-research">
        Review the steps in this file, and familiarize yourself with the existing game log functionality in GameLog.tsx and gameLog.service.ts. Understand how rolls are currently created and displayed.

        Investigate how to create a dialog in React using MUI components, and how to implement form handling and validation.

        Look into the dataswornTree.store.ts to understand how to fetch and display the list of active moves for the moveId field.

        Put together a plan, and ask any clarifying questions if needed.
    </step>
    <step id="2" type="implementation" name="update-database">
      Modify the game log database schema to include a new boolean field `isManual` to indicate if a roll was manually added.
      Update any relevant types or interfaces in the codebase to include this new field.
    </step>
    <step id="3" type="implementation" name="create-components">
        Create a new React component for the "Add Roll" dialog using MUI components. This component should include:
        - Dialog starts with a roll type selector
        - Form fields for all required roll details, with appropriate input types (text, number, select, autocomplete)
        - Validation logic to ensure required fields are filled and formatted correctly (prevent invalid dice values like d6=7, but oracle rolls don't need to be 1-100)
        - Move association only for applicable roll types: stat rolls (optional), track progress rolls (only moves that call for these rolls - see extractRollOptions), oracle rolls cannot be attached to moves
        - Stat keys dynamically loaded from current active ruleset
        - Logic to calculate fields that are usually calculated (like result for oracle rolls, actionTotal & result for stat rolls)
    </step>
    <step id="4" type="implementation" name="integrate-dialog">
        Integrate the "Add Roll" dialog component into the GameLog.tsx component. This should include:
        - An "Add Roll" button that opens the dialog when clicked.
        - Logic to pass necessary props to the dialog component, such as the list of active moves from dataswornTree.store.ts.
        - Handling the submission of the dialog to create a new roll entry in the game log using gameLog.store.ts.
    </step>
    <step id="5" type="testing" name="create-tests">
        Write unit tests for the new dialog component to ensure:
        - All form fields render correctly.
        - Validation logic works as expected.
        - Submission logic correctly creates a new roll entry with the provided details.

        Write integration tests to ensure the dialog integrates correctly with the GameLog component and gameLog.store.ts.
    </step>
</steps>
