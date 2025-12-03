# TickTask

TickTask ist eine moderne Produktivitäts-App, die dir hilft, deine Aufgaben effizient zu planen, zu verfolgen und zu erledigen. Die App konzentriert sich auf Fokus statt Überforderung und hilft dir dabei, produktiver zu werden, ohne überwältigt zu sein.

## 🎯 Hauptfunktionen

### Task-Management

- **Aufgaben erstellen und verwalten**: Erstelle Aufgaben mit geplanter Dauer und verfolge deinen Fortschritt
- **Timer-System**: Starte einen Timer für eine Aufgabe – nur eine Aufgabe läuft gleichzeitig, damit du dich vollständig konzentrieren kannst
- **Prioritäten**: Markiere wichtige Aufgaben als "Urgent" für bessere Übersicht
- **Wiederkehrende Tasks**: Erstelle Vorlagen für regelmäßig anfallende Aufgaben
- **Zeit-Tracking**: Plane Zeit für jede Aufgabe und verfolge, wie viel Zeit tatsächlich benötigt wurde

### Routinen

- **Morgenroutine**: Plane und verfolge deine morgendlichen Gewohnheiten
- **Abendroutine**: Organisiere deine abendlichen Routinen
- **Tägliche Tasks**: Aufgaben, die jeden Tag erledigt werden müssen
- **Wöchentliche Tasks**: Aufgaben, die an bestimmten Wochentagen anfallen

### Kalender

- **Wochenkalender**: Übersichtliche Darstellung deiner geplanten Aufgaben und Termine
- **Zeitplanung**: Plane Aufgaben für bestimmte Tage und Uhrzeiten
- **Termine verwalten**: Erstelle und verwalte Termine direkt im Kalender
- **Anpassbare Zeitspanne**: Passe die angezeigte Zeitspanne des Kalenders an (Start- und Endzeit)

### Goals (Ziele)

- **Ziele setzen**: Definiere Ziele mit geplanter Stundenanzahl
- **Fortschrittsbalken**: Verfolge deinen Fortschritt visuell
- **Task-Zuordnung**: Weise Aufgaben Zielen zu, um den Fortschritt automatisch zu verfolgen
- **Prioritäten**: Markiere wichtige Ziele mit einem Stern
- **Fälligkeitsdaten**: Setze Zieldaten und verfolge verbleibende Tage
- **Erledigte Goals**: Übersicht über abgeschlossene Ziele

### Streak-System

- **Tägliche Produktivität**: Halte deinen täglichen Produktivitäts-Streak am Laufen
- **Tag beenden**: Beende den Tag, wenn alle Aufgaben und Routinen erledigt sind, um deinen Streak zu erhalten

### Weitere Features

- **Offline-Funktionalität**: Funktioniert auch ohne Internetverbindung dank localStorage
- **Cloud-Sync**: Synchronisiere deine Daten mit Firebase für Zugriff von überall
- **Gast-Modus**: Teste die App ohne Registrierung
- **Mehrsprachigkeit**: Unterstützung für Deutsch und Englisch
- **Responsive Design**: Optimiert für verschiedene Bildschirmgrößen

## 🚀 Technologie-Stack

- **React**: Moderne UI-Bibliothek
- **Vite**: Schneller Build-Tool und Development-Server
- **Firebase**: Backend-as-a-Service für Authentifizierung und Datenbank
- **Firestore**: NoSQL-Datenbank für Echtzeit-Datensynchronisation
- **CSS Modules**: Scoped Styling für Komponenten
- **localStorage**: Client-seitige Datenspeicherung für Offline-Funktionalität

## 📦 Installation

1. Repository klonen:

```bash
git clone https://github.com/etienneauert/ticktaskV3.git
cd ticktaskV2
```

2. Abhängigkeiten installieren:

```bash
npm install
```

3. Firebase-Konfiguration einrichten:

   - Erstelle eine Firebase-Projekt
   - Kopiere deine Firebase-Konfiguration in `src/firebase/firebase.js`

4. Entwicklungsserver starten:

```bash
npm run dev
```

5. Für Produktion bauen:

```bash
npm run build
```

## 🎨 Design-Prinzipien

TickTask wurde mit folgenden Prinzipien entwickelt:

- **Fokus statt Überforderung**: Die App hilft dir, eine Aufgabe nach der anderen zu erledigen
- **Klare Routinen**: Strukturierte Morgen-, Tages-, Wochen- und Abendroutinen
- **Visuelles Feedback**: Fortschrittsbalken, Streaks und visuelle Indikatoren
- **Minimalistisches Design**: Dunkles Theme mit gelben Akzenten für bessere Lesbarkeit

## 📱 Verwendung

### Aufgaben erstellen

1. Gib eine Aufgabe in das Eingabefeld ein
2. Optional: Plane eine Dauer für die Aufgabe
3. Optional: Markiere die Aufgabe als "Urgent" oder "Wiederkehrend"
4. Optional: Weise die Aufgabe einem Ziel zu

### Timer verwenden

1. Klicke auf den Play-Button bei einer Aufgabe
2. Nur eine Aufgabe kann gleichzeitig laufen
3. Pausiere oder beende den Timer jederzeit
4. Markiere die Aufgabe als erledigt, wenn du fertig bist

### Routinen verwalten

1. Öffne die Einstellungen
2. Navigiere zu "Routine", "Täglich" oder "Wöchentlich"
3. Füge Aufgaben zu deinen Routinen hinzu
4. Bearbeite oder lösche Aufgaben nach Bedarf

### Ziele setzen

1. Gib ein Ziel in das Eingabefeld unter "Goals" ein
2. Definiere die benötigte Stundenanzahl
3. Optional: Setze ein Zieldatum und Priorität
4. Weise Aufgaben dem Ziel zu, um den Fortschritt zu verfolgen

## 🔧 Einstellungen

Die App bietet umfangreiche Einstellungsmöglichkeiten:

- **Allgemein**: Streak-Verwaltung, Sprachauswahl
- **Kalender**: Start- und Endzeit anpassen, Kalender ein-/ausblenden
- **Routine**: Morgen- und Abendroutinen verwalten
- **Täglich**: Tägliche Aufgaben verwalten
- **Wöchentlich**: Wöchentliche Aufgaben nach Wochentag verwalten

## 📄 Lizenz

Dieses Projekt ist privat.

## 👤 Autor

Etienne Auert

---

**TickTask** - Fokus statt Überforderung. Plane effizient, erledige eine Aufgabe nach der anderen und beende Routinen klar strukturiert.
