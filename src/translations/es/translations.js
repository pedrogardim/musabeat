export const TRANSLATIONS_ES = {
  home: {
    unloggedWelcome: "¡Bienvenido a MusaBeat!",
    userWelcome: "Bienvenido",
    notLoggedButton: "No has iniciado sesión",
    sessions: "Sesiones",
    communityCreated: "La comunidad ha creado:",
    userCreated: "Has creado:",
  },
  auth: {
    login: "Iniciar sesión",
    description:
      "Guarda y comparte sesiones en la nube, y ábrelas donde y cuando quieras. ¡Ingresa ahora!",
    googleLogin: "Ingresar con Google",
    emailLogin: "Ingresar con correo electrónico",
    creatingAccount: "Usuario no encontrado, creando una cuenta",
    createAccount: "Crear cuenta",
    name: "Nombre",
    email: "Correo electrónico",
    password: "Contraseña",
    confirmPassword: "Confirmar contraseña",
  },
  sidemenu: {
    newSession: "Crear sesión",
    explore: "Explorar",
    instruments: "Instrumentos",
    drumsets: "Sets de batería",
    files: "Archivos",
  },
  avatar: {
    profile: "Perfil",
    userSessions: "Mis Sesiones",
    userSamples: "Mis Archivos",
    userPatches: "Mis Patches",
    userDrumPatches: "Mis Sets de Batería",
    logOut: "Desconectar",
  },
  workspace: {
    empty: "¡Vaya, no hay módulos!",
    addBtn: "Añadir Módulo",
    sessionNotFound: "Sesión No encontrada",
    actions: {
      copyPasteIncompatible:
        "El contenido que intentas pegar pertenece a otro tipo de módulo",
      copyPasteEmptyClipboard: "Nada que pegar",
      copySuccess: "Copiado del módulo",
      pasteSuccessMeasure: "Compás copiado pegado en el módulo",
      pasteSuccessChord: "Acorde copiado pegado en el módulo",
      stepsChange: "Pasos en el módulo final cambiado a",
    },
    options: {
      hiddenSession: "Sesión Oculta",
      allowCopies: "Permitir Cópias",
      realtimeEdit: "Edición en tiempo real",
    },
  },
  WSTitle: {
    viewMode:
      "Modo Vista: ¡No tienes el permiso para editar esta sesión! To be able to edit it create a copy",
    unloggedEditor:
      "No has iniciado sesión! Los cambios no serán guardados en la nube",
    untitledSession: "Sesión sin nombre",
  },
  module: {
    options: {
      fullscreen: "Pantalla Completa",
      loadFile: "Cargar archivo",
      instrument: "Instrumento",
      settings: "Ajustes",
      effects: "Efectos",
      duplicate: "Duplicar",
      remove: "Eliminar módulo",
    },
    settings: {
      steps: "Pasos",
      length: "Duración (compases)",
      sessionScale: "Sesión",
    },
  },
  instrumentEditor: {
    noFiles: "Instrumento Vacío",
    addFile: "Añadir archivo",
    removingItemAlert:
      "Este sonido será removido del instrumento. El archivo seguirá a salvo en tu cuenta.",
    types: {
      MonoSynth: "Sintetizador + Filtro",
      FMSynth: "Sintetizador FM",
      AMSynth: "Sintetizador AM",
      Sampler: "Sampler",
    },
    synthEditor: {
      parameters: {
        oscillator: "Oscilador",
        type: "Tipo",
        wave: "Onda",
        harmonicity: "Harmonicidad",
        modwave: "Onda de Mod.",
        mod: "Mod.",
        modulationIndex: "Índice de Mod.",
        filter: "Filtro",
        frequency: "Frecuencia",
        resonance: "Resonancia",
        envelope: "Envelope",
      },
      waveTypes: {
        sine: "Sinusoidal",
        square: "Cuadrada",
        triangle: "Triangular",
        sawtooth: "Sierra",
      },
      oscMode: {
        basic: "Básico",
        fm: "FM",
        am: "AM",
        fat: "Analógico",
        pwm: "PWM",
        pulse: "Pulso",
      },
    },
    drumComponent: {
      emptySlot: "Slot Vacío",
    },
  },
  modulePicker: {
    create: "Crear nuevo módulo",
    submit: "Añadir Módulo",
    types: {
      0: {
        name: "Secuenciador",
        description:
          "Un sequenciador de ritmos que controla sonidos de una batería",
      },
      1: {
        name: "Cuadrícula de melodía",
        description:
          "Genera melodías con una cuadrícula similar a un secuenciador, pero con notas",
      },
      2: {
        name: "Progresión de acordes",
        description:
          "Crea una progresión de acores, con el control sobre sus notas y rítmos",
      },
      3: {
        name: "Player",
        description:
          "Modulo que posibilita tanto la reproducción de archivos de audio, cuanto la manipulación de su velocidad de reproducción y cambio de tono",
      },
      4: {
        name: "Piano Roll",
        description: "La forma clásica de hacer musica en una DAW!",
      },
    },
  },
  patchExplorer: {
    userPatches: "Mis Patches",
    instrumentEditor: "Editor de instrumento",
    patchNotFound: "Instrumento no encontrado",
  },
  fileExplorer: {
    fileNotFound: "Archivo no encontrado",
  },
  misc: {
    createdOn: "Creado el",
    uploadedOn: "Subido el",
    saveChanges: "Guardar cambios",
    changesSaved: "Cambios guardados",
    allCategories: "Todas las Categorías",
    noCategory: "Sín Categoría",
    none: "Ninguno",
    offlineAlert:
      "MusaBeat requiere una conexión estable a al servidor. Comprueba tu conexión a internet.",
    initialModules: "Módulos Iniciales",
    comingSoon: "(Próximamente)",
    nothingFound: "No se ha encontrado nada",
  },
  dialogs: {
    cancel: "Cancelar",
    confirm: "OK",
    submit: "Enviar",
    delete: "Eliminar",
    loginWithGoogle: "Iniciar sesión con Google",
    areYouSure: "¿Estás seguro?",
    irreversibleAction: "Esta medida no se puede deshacer",
    insertName: "Insertar nombre",
    insertNote: "Insertar nota",
    sessionInfo: "Información de la sessión",
    patchName: "Nombre del Patch",
    unsavedChanges: "¿Estás seguro? Los cambios no guardados se perderán",
    dupSession: "¿Crear una copia de esta sesión para tu cuenta?",
  },
  info: {
    name: "Nombre",
    description: "Descripción",
    tags: "Tags",
  },
  music: {
    root: "Tónica",
    scale: "Escala",
    complexity: "Complejidad",
    scales: {
      0: "Mayor",
      1: "Pentatónica Mayor",
      2: "Menor",
      3: "Armónica Menor",
    },
    instrumentsCategories: {
      0: "Teclas",
      1: "Sintetizadores",
      2: "Bajo",
      3: "Pad",
    },
    drumCategories: { 0: "Electrónica", 1: "Acústica", 2: "FX", 3: "Étnico" },
  },
  user: {
    followers: "seguidores",
    userNotFound: "Usuário No Encontrado",
  },
};
