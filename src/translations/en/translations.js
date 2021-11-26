export const TRANSLATIONS_EN = {
  home: {
    unloggedWelcome: "Welcome to MusaBeat!",
    userWelcome: "Welcome",
    notLoggedButton: "You are not logged in",
    sessions: "Sessions",
    communityCreated: "Our community has created:",
    userCreated: "You hace created:",
  },

  auth: {
    login: "Log in",
    description:
      "Store and share sessions in the cloud, and open them wherever and whenever you want. Create an account now!",
    googleLogin: "Log In with Google",
    emailLogin: "Log In with Email",
    creatingAccount: "User not found, creating account",
    createAccount: "Create account",
    name: "Username",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
  },

  sidemenu: {
    newSession: "New Session",
    explore: "Explore",
    instruments: "Instruments",
    drumsets: "Drum Sets",
    files: "Files",
  },
  avatar: {
    profile: "Profile",
    userSessions: "My Sessions",
    userSamples: "My Samples",
    userPatches: "My Patches",
    userDrumPatches: "My Drumsets",
    logOut: "Log Out",
  },
  workspace: {
    empty: "No Modules!",
    addBtn: "Add New Module",
    sessionNotFound: "Session Not Found",
    actions: {
      copyPasteIncompatible:
        "The content you are trying to paste belongs to a different type of module",
      copyPasteEmptyClipboard: "Nothing to paste",
      copySuccess: "Copied from module",
      pasteSuccessMeasure: "Copied measure pasted on module",
      pasteSuccessChord: "Copied chord pasted on module",
      stepsChange: "Steps on target were changed to",
    },
    options: {
      hiddenSession: "Hidden Session",
      allowCopies: "Allow Copies",
      realtimeEdit: "Real-time Editing",
    },
  },
  WSTitle: {
    viewMode:
      "View Mode: You don't have the permission to edit this session! To be able to edit it create a copy",
    unloggedEditor: "You are not logged in! Changes will not be saved",
    untitledSession: "Untitled Session",
  },
  module: {
    options: {
      fullscreen: "Fullscreen",
      loadFile: "Load audio file",
      instrument: "Instrument",
      settings: "Settings",
      effects: "Effects",
      duplicate: "Duplicate",
      remove: "Remove Module",
    },
    settings: {
      steps: "Steps",
      length: "Length (In measures)",
      sessionScale: "Session",
    },
  },
  instrumentEditor: {
    noFiles: "Empty Instrument",
    addFile: "Add File",
    removingItemAlert:
      "This sound will be removed from the instrument. The file will remain safe in your account.",
  },
  modulePicker: {
    create: "Create a new module",
    submit: "Add Module",
    types: {
      0: {
        name: "Sampler",
        description:
          "Rhythm sequencer that controls a drum pack (or play sounds)",
      },
      1: {
        name: "Melody Track",
        description: "Crea melodías",
      },
      2: {
        name: "Audio Track",
        description: "Play audio files imported by the user",
      },
      3: {
        name: "Chord Progression",
        description:
          "Create chord progressions, or generate random ones based on scales",
      },
    },
  },

  patchExplorer: {
    userPatches: "User Patches",
    instrumentEditor: "Instrument Editor",
    patchNotFound: "Patch Not Found",
  },
  fileExplorer: {
    fileNotFound: "File Not Found",
  },
  misc: {
    createdOn: "Created on",
    uploadedOn: "Uploaded on",
    saveChanges: "Save changes",
    changesSaved: "Changes saved",
    allCategories: "All Categories",
    noCategory: "No Category",
    none: "None",
    offlineAlert:
      "MusaBeat requires a stable connection to the server. Check your internet connetion.",
    initialModules: "Initial Modules",
    comingSoon: "(Coming Soon)",
    nothingFound: "Nothing Found",
  },
  dialogs: {
    cancel: "Cancel",
    confirm: "OK",
    submit: "Submit",
    delete: "Delete",
    areYouSure: "Are you sure?",
    irreversibleAction: "This is an action that can't be undone",
    insertName: "Insert name",
    insertNote: "Insert note",
    sessionInfo: "Session Info",
    patchName: "Patch Name",
    unsavedChanges: "Are you sure? Any unsaved changes will not be saved",
    dupSession: "Create a copy of this session for your account?",
  },
  info: {
    name: "Name",
    description: "Description",
    tags: "Tags",
  },
  music: {
    root: "Root",
    scale: "Scale",
    complexity: "Complexity",
    scales: {
      0: "Major",
      1: "Major Pentatonic",
      2: "Minor",
      3: "Harmonic Minor",
    },
    instrumentsCategories: { 0: "Keys", 1: "Synth", 2: "Bass", 3: "Pad" },
    drumCategories: { 0: "Electronic", 1: "Acoustic", 2: "FX", 3: "Ethnic" },
  },
};
