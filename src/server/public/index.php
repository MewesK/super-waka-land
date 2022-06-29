<?php
use Dotenv\Dotenv;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Exception\HttpBadRequestException;
use Slim\Exception\HttpInternalServerErrorException;
use Slim\Exception\HttpNotFoundException;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

$app = AppFactory::create();

//
// Config
//

$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();
$dotenv->required(['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS', 'DB_TABLE'])->notEmpty();

//
// Middleware
//

$errorMiddleware = $app->addErrorMiddleware(true, true, true);
$errorHandler = $errorMiddleware->getDefaultErrorHandler();
$errorHandler->forceContentType('application/json');

$app->add(function ($request, $handler) {
    $response = $handler->handle($request);
    return $response
            ->withHeader('Access-Control-Allow-Origin', '*')
            ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
});

$app->addRoutingMiddleware();
$app->addBodyParsingMiddleware();

//
// Database
//

function getDatabase() {
  return new PDO('mysql:host='.$_ENV['DB_HOST'].';dbname='.$_ENV['DB_NAME'].';charset=utf8', $_ENV['DB_USER'], $_ENV['DB_PASS']);
}

function getLeaderboard(string $version = '1.0', int $limit = 100) {
  $dbh = getDatabase();

  $stmt = $dbh->prepare("SELECT * FROM `${$_ENV['DB_TABLE']}` WHERE `version` = :version ORDER BY `score` DESC LIMIT :limit");
  $stmt->bindParam('version', $version, PDO::PARAM_STR);
  $stmt->bindParam('limit', $limit, PDO::PARAM_INT);
  $stmt->execute();

  $leaderboard = [];
  foreach ($stmt as $row) {
    $leaderboard[] = [
      "name" => $row['name'],
      "score" => $row['score'],
      "version" => $row['version'],
      "created" => $row['created']
    ];
  }

  $stmt = null;
  $dbh = null;

  return $leaderboard;
}

function addScore(string $version = '1.0', string $name, int $score) {
  $dbh = getDatabase();

  $stmt = $dbh->prepare("INSERT INTO `${$_ENV['DB_TABLE']}` (`id`, `name`, `score`, `version`, `created`) VALUES (NULL, :name, :score, :version, CURRENT_TIMESTAMP)");
  $stmt->bindParam('name', $name, PDO::PARAM_STR);
  $stmt->bindParam('score', $score, PDO::PARAM_INT);
  $stmt->bindParam('version', $version, PDO::PARAM_STR);
  $stmt->execute();
  $id = (int) $dbh->lastInsertId();

  $stmt = $dbh->prepare("SELECT * FROM (SELECT *, ROW_NUMBER() OVER (ORDER BY `score` DESC)  AS `rank` FROM `${$_ENV['DB_TABLE']}` WHERE `version` = :version) temp WHERE `id` = :id");
  $stmt->bindParam('version', $version, PDO::PARAM_STR);
  $stmt->bindParam('id', $id, PDO::PARAM_INT);
  $stmt->execute();
  $row = $stmt->fetch(PDO::FETCH_ASSOC);

  $stmt = null;
  $dbh = null;

  return $row;
}

//
// Actions
//

$app->options('/{routes:.+}', function (Request $request, Response $response) {
    return $response;
});

$app->get('/highscore/{version}', function (Request $request, Response $response, $args) {
  if (!strstr($request->getHeaderLine('Content-Type'), 'application/json')) {
    throw new HttpBadRequestException($request, 'Invalid content-type');
  }

  $version = isset($args['version']) ? $args['version'] : '1.0';

  $leaderboard = getLeaderboard($version);

  $response->getBody()->write(json_encode($leaderboard));
  return $response->withHeader('Content-Type', 'application/json');
});

$app->post('/highscore/{version}', function (Request $request, Response $response, $args) {
  if (!strstr($request->getHeaderLine('Content-Type'), 'application/json')) {
    throw new HttpBadRequestException($request, 'Invalid content-type');
  }

  $version = isset($args['version']) ? $args['version'] : '1.0';
  $data = $request->getParsedBody();
  if (!isset($data['name']) || !isset($data['score']) || strlen($data['name']) > 32) {
    throw new HttpBadRequestException($request, 'Invalid body');
  }

  $ranking = addScore($version, $data['name'], (int) $data['score']);
  if (!$ranking) {
    throw new HttpInternalServerErrorException($request, 'Database error');
  }

  $response->getBody()->write(json_encode($ranking));
  return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
});

$app->map(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], '/{routes:.+}', function(Request $request, Response $response) {
    throw new HttpNotFoundException($request);
});

$app->run();