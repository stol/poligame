ALTER TABLE textes ADD status INT DEFAULT 0 AFTER link;

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
  `abstention_assemblee` int(11) NOT NULL DEFAULT '0',
  `url_lf` mediumtext CHARACTER SET latin1,
  `url_an` mediumtext CHARACTER SET latin1,
  `url_sn` mediumtext CHARACTER SET latin1,
  `status` int(11) DEFAULT '0',
  `analysed` int(11) NOT NULL DEFAULT '0',
  `starts_at` timestamp NULL DEFAULT NULL,
  `ends_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_hash` (`id_hash`),
  KEY `id` (`id`,`type`)
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

CREATE TABLE `seances` (
  `bill_id` int(11) DEFAULT NULL,
  `lecture` int(11) unsigned DEFAULT NULL,
  `date` timestamp NULL DEFAULT NULL,
  UNIQUE KEY `seance` (`bill_id`,`lecture`,`date`),
  KEY `lecture` (`bill_id`,`lecture`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;