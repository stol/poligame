-- Create syntax for TABLE 'amendements'
CREATE TABLE `amendements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` int(11) DEFAULT NULL,
  `texte_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id` (`id`,`type`),
  KEY `texte_id` (`texte_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- Create syntax for TABLE 'articles'
CREATE TABLE `articles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` int(11) DEFAULT NULL,
  `texte_id` int(11) DEFAULT NULL,
  `number` varchar(5) CHARACTER SET utf8 DEFAULT NULL,
  `title` mediumtext CHARACTER SET utf8,
  `content` mediumtext CHARACTER SET utf8,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `type` (`type`,`texte_id`,`number`),
  KEY `texte_id` (`texte_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- Create syntax for TABLE 'bills'
CREATE TABLE `bills` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` int(11) DEFAULT NULL,
  `id_hash` int(11) DEFAULT NULL,
  `title` mediumtext CHARACTER SET latin1,
  `communique` mediumtext CHARACTER SET latin1,
  `communique_title` mediumtext CHARACTER SET latin1,
  `pour` int(11) NOT NULL DEFAULT '0',
  `contre` int(11) NOT NULL DEFAULT '0',
  `abstention` int(11) NOT NULL DEFAULT '0',
  `pour_assemblee` int(11) NOT NULL DEFAULT '0',
  `contre_assemblee` int(11) NOT NULL DEFAULT '0',
  `abstention_assemblee` int(11) unsigned NOT NULL DEFAULT '0',
  `url_lf` mediumtext CHARACTER SET latin1,
  `url_an` mediumtext CHARACTER SET latin1,
  `url_sn` mediumtext CHARACTER SET latin1,
  `status` int(11) DEFAULT '0',
  `analysed` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_hash` (`id_hash`),
  KEY `id` (`id`,`type`)
) ENGINE=InnoDB AUTO_INCREMENT=1041 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- Create syntax for TABLE 'seances'
CREATE TABLE `seances` (
  `bill_id` int(11) DEFAULT NULL,
  `lecture` int(11) unsigned DEFAULT NULL,
  `date` timestamp NULL DEFAULT NULL,
  UNIQUE KEY `seance` (`bill_id`,`date`),
  KEY `lecture` (`bill_id`,`lecture`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- Create syntax for TABLE 'textes'
CREATE TABLE `textes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` int(11) DEFAULT NULL,
  `id_hash` int(11) DEFAULT NULL,
  `title` mediumtext CHARACTER SET utf8,
  `description` mediumtext CHARACTER SET utf8,
  `description_title` mediumtext CHARACTER SET utf8,
  `pour` int(11) NOT NULL DEFAULT '0',
  `contre` int(11) NOT NULL DEFAULT '0',
  `abstention` int(11) NOT NULL DEFAULT '0',
  `pour_assemblee` int(11) NOT NULL DEFAULT '0',
  `contre_assemblee` int(11) NOT NULL DEFAULT '0',
  `abstention_assemblee` int(11) NOT NULL DEFAULT '0',
  `link` mediumtext CHARACTER SET utf8,
  `status` int(11) DEFAULT '0',
  `analysed` int(11) NOT NULL DEFAULT '0',
  `starts_at` timestamp NULL DEFAULT NULL,
  `ends_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_hash` (`id_hash`),
  KEY `id` (`id`,`type`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- Create syntax for TABLE 'users'
CREATE TABLE `users` (
  `id` varchar(15) CHARACTER SET utf8 NOT NULL DEFAULT '',
  `firstname` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `lastname` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `link` mediumtext CHARACTER SET utf8,
  `is_qualified` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- Create syntax for TABLE 'votes'
CREATE TABLE `votes` (
  `user_id` varchar(15) CHARACTER SET utf8 NOT NULL DEFAULT '',
  `obj_id` int(11) NOT NULL DEFAULT '0',
  `obj_type` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`obj_type`,`obj_id`),
  KEY `obj_id` (`obj_id`,`obj_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- Create syntax for TABLE 'votes_anon'
CREATE TABLE `votes_anon` (
  `obj_id` int(11) DEFAULT NULL,
  `obj_type` int(11) DEFAULT NULL,
  `gender` int(11) DEFAULT NULL,
  `bord` int(11) DEFAULT NULL,
  `csp` int(11) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `choice` int(11) DEFAULT NULL,
  KEY `obj_id` (`obj_id`,`obj_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;