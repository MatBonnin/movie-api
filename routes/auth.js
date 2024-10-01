const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

/**
 * POST /auth/register
 * Body: { "email": "user@example.com", "password": "password123" }
 * Crée un nouvel utilisateur avec un email et un mot de passe.
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifie si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email déjà utilisé.' });
    }

    // Hash le mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crée le nouvel utilisateur
    const user = await User.create({ email, password: hashedPassword });

    res.status(201).json({ message: 'Utilisateur créé avec succès.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /auth/login
 * Body: { "email": "user@example.com", "password": "password123" }
 * Retourne un token JWT si les identifiants sont valides.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Recherche de l'utilisateur
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    // Compare les mots de passe
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    // Génération du token
    const payload = { id: user.id, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.TOKEN_EXPIRATION,
    });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
