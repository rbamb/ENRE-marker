sub usage($) {
    return shift(@_) . <<"END_USAGE";
Usage: $0 -db database
  -db database      Specify Understand database (required for
                    uperl, inherited from Understand)
  -outputFile       Specify the output json file
  -detail           Input with detail information
  -language         Language filter, default don't filter. Possible values include "Ada", "C", "C#", "Fortran", "Java", "Jovial", "Pascal",
                      "Plm", "VHDL" and "Web". C++ is included as part of "C".
  -csv              Only output csf, for debug purpose.
END_USAGE
}

use Understand;
use Getopt::Long;
use strict;
use Data::Dumper;
use JSON;
use File::Basename;

my $dbPath;
my $outputFile;
my $detailOpt;
my $languageFilter;
my $csvOpt;
my $help;

GetOptions(
  "db=s" => \$dbPath,
  "language=s" => \$languageFilter,
  "detail" => \$detailOpt,
  "outputFile=s"  => \$outputFile,
  "csv" => \$csvOpt,
  "help" => \$help,
);

# help message
die usage("") if ($help);

die usage("Please specify output json file\n") unless ($outputFile);

$| = 1;

# open the database
print "Parsing dependencies ...";
my $db=openDatabase($dbPath);
print "\rParsing dependencies Done\n";

#code body*******************************************************************

print "\rExtracting dependencies ...";

my @depends;
my @ents = $db->ents("file ~unresolved ~unknown");
my @references;
foreach my $ent (@ents) {
  next if($languageFilter && ($languageFilter ne $ent->language));
  foreach my $dep ($ent->depends()) {
    foreach my $ref ($dep->values()) {
      push @references, $ref;
    }
  }
}


my %cached_refs;
sub get_ref {
  my ($ent) = @_;
  if (exists $cached_refs{$ent->id}) {
    return $cached_refs{$ent->id};
  } else {
    my $ref = $ent->ref("define,definein"); # the entity being referenced
    $cached_refs{$ent->id} = $ref;
    return $ref;
  }
}

print "\rExtracting dependencies Done\n";

print "Exporting depends ...";


my @entity,
my %hash_variables;
my $index = 0;


#foreach my $ent ($db->ents()) {
#	my %cell = (
#     'entityName' => $ent->longname(),
#    'entityType' => $ent->kindname(),
#  );
#	push @entity, \%cell;
#}

my $file;
my @lexemes,
my $entity;
my $loc;
my $lexeme;
my $token;


foreach $file ($db->ents("file")){
	@lexemes=$file->lexer()->lexemes();
    foreach $lexeme (@lexemes){
        $token=$lexeme->token();
        if($token eq "Identifier"){
            $entity=$lexeme->ent();
            if($entity){
				$loc=$entity->metric("CountLine"),"\n";
				if($loc){
					my %cell = (
						'entityName' => $entity->longname(),
						'entityType' => $entity->kindname(),
						'entityFile' => $file->longname(),
						'start_line' => $lexeme->line_begin(),
						'start_column' => $lexeme->column_begin(),
						'end_line' => $lexeme->line_end(),
						'end_column' => $lexeme->column_end()
					);
					push @entity, \%cell;
				}    
            }
        }
    }
}

print_depends_json(@depends) unless $csvOpt;

print "\rExporting depends Done\n";

#end body********************************************************************
closeDatabase($db);


# subroutines

sub print_depends_json {
  my (@_depends) = @_;
  open(FILE,">$outputFile") || die("Couldn't write to output json file. $!");

  my $json = JSON::PP->new->ascii->pretty->allow_nonref;
  print FILE $json->encode(convert_to_hash(@_depends));
}

sub convert_to_hash {
  my (@_depends) = @_;
  my %depends_hash = (
    'schemaVersion' => '1.0',
    'name' => name(),
	'entity' => \@entity,
  );

  return \%depends_hash;
}

sub name {
  return basename($db->name());
}




sub openDatabase($)
{
    my ($dbPath) = @_;

    my $db = Understand::Gui::db();

    # path not allowed if opened by understand
    if ($db&&$dbPath) {
  die "database already opened by GUI, don't use -db option\n";
    }

    # open database if not already open
    if (!$db) {
  my $status;
  die usage("Error, database not specified\n\n") unless ($dbPath);
  ($db,$status)=Understand::open($dbPath);
  die "Error opening database: ",$status,"\n" if $status;
    }
    return($db);
}

sub closeDatabase($)
{
    my ($db)=@_;

    # close database only if we opened it
    $db->close() if $dbPath;
}